import { withAuth } from "@/app/lib/api/withAuth";
import { githubService } from "@/app/lib/github";
import { normalizeProjectName } from "@/app/lib/util/string";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { Project } from "@/app/lib/util/supabase/types/tables";
import { ApiResponse } from "@/app/lib/util/types/api";
 
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Update project name and propagate changes to GitHub repo and Dokku app
 * @param request
 * @returns
 */
export const PUT = withAuth(async (request: NextRequest) => {
    try {
        const { newProjectName, projectId } = await request.json();
        const supabase = createSupabaseAdminClient()

        //Validate json request body
        if (!projectId || !newProjectName) {
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: "Project ID and new project name are required",
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Get current project data
        const { data: currentProject, error: fetchError } = await supabase
        .from("project")
        .select("project_name, repo_url")
        .eq("project_id", projectId)
        .single();

        if (fetchError || !currentProject) {
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: "Project not found",
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 404 });
        }

        const oldProjectName = currentProject.project_name;
        const oldRepoName = `${projectId}-${normalizeProjectName(oldProjectName)}`;
        const newRepoName = `${projectId}-${normalizeProjectName(newProjectName)}`;

        // Update project name in database and preview URL
        const { data: updatedProject, error: updateError } = await supabase
        .from("project")
        .update({
            project_name: newProjectName
        })
        .eq("project_id", projectId)
        .select()
        .single();

        if (updateError) {
            console.error("Error updating project:", updateError);
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: updateError.message,
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        // Propagate name changes to infrastructure (async, don't block response)
        (async () => {
        try {
            // const { dokkuAppRename } = await import("@/server/dokku/dokku-update");
            
            const results = await Promise.allSettled([
                // Rename GitHub repository
                githubService.renameRepository(oldRepoName, newRepoName),
                // Rename Dokku app
                // dokkuAppRename(oldRepoName, newRepoName),
            ]);

            console.log("✅ Infrastructure rename completed", results);
        } catch (error) {
            console.error("Error propagating name changes:", error);
            // Don't fail the request if infrastructure updates fail
            // User can retry or we can handle this in a background job
        }
        })();

        const successResponse: ApiResponse<Project> = {
            success: true,
            data: updatedProject,
            error: undefined,
        };

        return NextResponse.json(successResponse);
    } catch (error) {
        console.error("Error updating project name:", error);
            const errorResponse: ApiResponse<null> = {
            success: false,
            error: "Internal server error",
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
})
