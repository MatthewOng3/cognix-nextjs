"use server"
/* eslint-disable */

import { type NextRequest, NextResponse } from "next/server";
import { githubService, SecretItem } from "@/app/lib/github";
import { normalizeProjectName } from "@/app/lib/util/string";
import { createChatSession } from "@/app/lib/util/supabase/functions/chat";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type {
  ChatSession,
  Project,
} from "@/app/lib/util/supabase/types/tables";
import type {
  ApiResponse,
  CreateProjectResponse,
  ProjectWithChatSessions,
} from "@/app/lib/util/types/api";

import { withAuth } from "@/app/lib/api/withAuth";
import { envConfig } from "@/app/lib/util/env-config";
import { copyTemplateVectorsToProject } from "@/app/lib/pinecone/copy_base_index";
import { triggerDevImageBuild } from "@/app/lib/api/project";

const supabase = createSupabaseAdminClient();

/**
 * @description Server side API route to create a new project and chat session, create repository for user to store code.
 * Create repository secrets necessary for dokku deployment.
 * @param request
 * @returns
 */
export const POST = withAuth(async (request: NextRequest ) =>  {
  try {
    console.time("create-project");
    const { projectName, userId } = await request.json();
    const { dokkuAppSetup } = await import("@/server/dokku/dokku-create-project");

    const projectId = crypto.randomUUID();
    const repoName = `${projectId}-${normalizeProjectName(projectName)}`;
    const dokkuAppName = `preview-cognix-${projectId}`
    
    // CRITICAL: Create repository first (AI needs this to clone/push code)
    const repository = await githubService.createRepositoryFromTemplate({
      templateRepo: "project-template",
      description: "",
      projectName: repoName,
      isPrivate: true,
      autoInit: true,
    });
    
    // Create project record in database
    const { data: projectData, error: projectError } = await supabase
      .from("project")
      .insert({
        project_id: projectId,
        project_name: projectName,
        user_id: userId,
        status: "Draft",
        repo_id: repository.id,
        repo_url: repository.html_url,
        preview_url: `https://${dokkuAppName}.${envConfig.subdomain}.${envConfig.domain}`,
        dokku_app_name: dokkuAppName,
        document_json: []
      })
      .select()
      .single();

    if (projectError) {
        console.error("Error creating project:", projectError);
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: projectError?.message,
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }

    const project: Project = projectData;

    // Create chat sessions (required for AI interaction)
    let chatSession: ChatSession;
    let plannerSession: ChatSession;
    
    // Only create chat sessions if project was successfully created
    try {
        chatSession = await createChatSession(
            project.project_id,
            userId,
            "Builder",
        );
        plannerSession = await createChatSession(
            project.project_id,
            userId,
            "Planner",
        );

        console.log("✅ Chat sessions created successfully")
    } catch (chatError) {
        console.error("Error creating chat sessions:", chatError);
        const partialErrorResponse: ApiResponse<Project> = {
            success: false,
            error: "Project created but failed to create chat sessions",
            data: project,
        };
        return NextResponse.json(partialErrorResponse, { status: 207 });
    }

    // Background tasks (don't block response)
    const baseProjectSecrets:SecretItem[] = [
        { secretName: "SSH_DOKKU_PRIVATE_KEY", secretValue: process.env.SSH_DOKKU_KEY },
        { secretName: "DOCKERHUB_USERNAME", secretValue: process.env.DOCKERHUB_USERNAME },
        { secretName: "DOCKERHUB_TOKEN", secretValue: process.env.DOCKERHUB_TOKEN }
    ];

    (async () => {
        const backgroundResults = await Promise.allSettled([
        //Copy template index to user index
        copyTemplateVectorsToProject(userId, projectId),
        //Set up user project on dokku droplet
        dokkuAppSetup(dokkuAppName, projectId),
        //triggerDevImageBuild(projectId, userId, repository.id),
        githubService.createRepositorySecrets(repository.id, baseProjectSecrets),
        // ✅ Generate initial snapshot via centralized Python API
        //generateSnapshotViaPython(projectId, userId, repository.id),
        ]);
        console.log("✅ Background tasks finished", backgroundResults)
    })();

    // Return immediately so user can start chatting
    const successResponse: ApiResponse<CreateProjectResponse> = {
      success: true,
      data: {
        project,
        chatSession,
        plannerSession,
      },
      error: undefined,
    };
    console.timeEnd("create-project");
    return NextResponse.json(successResponse);
  } catch (error) {
        console.error("Error in project creation:", error);
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: "Internal server error",
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 500 });
  }
})

/**
 * @description Server side API route to fetch all projects for a user with their chat session IDs
 * @param request
 * @returns
 */
export const GET = withAuth(async (request: NextRequest ) =>  {
  try {
    const { searchParams } = new URL(request.url);
     
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");
   
    if (!userId) {
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: "User ID is required",
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 400 });
    }

    let query = supabase
      .from("project")
      .select(`
                *,
                chat_session!inner(
                    chat_session_id,
                    chat_type
                )
            `)
      .eq("user_id", userId);

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    query = query.order("created_at", { ascending: false });

    const { data: projectsWithSessions, error: projectsError } = await query;

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: projectsError.message,
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
     
    const transformProject = (project: any) => {
     
      const builderSession = project.chat_session?.find(
        (session: any) => session.chat_type === "Builder",
      );
     
      const plannerSession = project.chat_session?.find(
        (session: any) => session.chat_type === "Planner",
      );
      return {
        ...project,
        builderSessionId: builderSession?.chat_session_id || null,
        plannerSessionId: plannerSession?.chat_session_id || null,
        chat_session: undefined,
      };
    };

    let transformedProjects;
    if (projectId) {
      const project =
        projectsWithSessions && projectsWithSessions.length > 0
          ? projectsWithSessions[0]
          : null;
      transformedProjects = project ? transformProject(project) : null;
    } else {
      transformedProjects = projectsWithSessions?.map(transformProject) || [];
    }

    const successResponse: ApiResponse<ProjectWithChatSessions> = {
      success: true,
      data: transformedProjects,
      error: undefined,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error fetching projects:", error);
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Internal server error",
      data: null,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
})

