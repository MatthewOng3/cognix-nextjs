import axios from "axios";
import type { ProjectData, ProjectInfo } from "../redux/features/projectSlice";
import { envConfig } from "../util/env-config";
import type { ApiResponse, CreateProjectResponse } from "../util/types/api";

export class ProjectCreationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProjectCreationError";
    this.status = status;
  }
}

/**
 * @description Get full project data to be saved in redux state
 * @param projectId
 * @returns
 */
export async function getFullProjectData(
  projectId: string,
): Promise<ProjectData> {
  if (!projectId) throw new Error("Project ID is required");

  const response = await fetch(`/api/projects/${projectId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const responseData: ApiResponse<ProjectData> = await response.json();

  if (!responseData.success || !responseData.data) {
    throw new Error(responseData.error || "Failed to fetch full project data");
  }

  return responseData.data;
}

/**
 * @description Get full list of projects from user
 * @returns
 */
export async function getProjectList(): Promise<ProjectInfo[]> {
  const response = await fetch(`/api/projects/project_list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const responseData: ApiResponse<ProjectInfo[]> = await response.json();

  if (!responseData.success || !responseData.data) {
    throw new Error(responseData.error || "Failed to fetch full project list");
  }

  return responseData.data;
}

export async function createProjectForPrompt(
  projectPrompt: string,
  userId: string | undefined,
): Promise<{ project: ProjectData; buildPath: string }> {
  if (!projectPrompt.trim()) {
    throw new Error("Project prompt is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const suffix = crypto.randomUUID().slice(0, 4);
  const projectName = `Project-${suffix}`;

  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      projectName,
      userId,
    }),
  });

  const result: ApiResponse<CreateProjectResponse> = await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new ProjectCreationError(
      result.error || "Failed to create project",
      response.status,
    );
  }

  const project = result.data.project;

  return {
    project: {
      projectId: project.project_id,
      projectName: project.project_name,
      description: "",
      status: "Draft",
      productDocMarkdown: null,
      productDocBlocknote: null,
      repoId: project.repo_id,
      repoUrl: project.repo_url,
      createdAt: project.created_at.toString(),
      builderSessionId: result.data.chatSession.chat_session_id,
      plannerSessionId: result.data.plannerSession.chat_session_id,
      generatedPrd: false,
      previewUrl: project.preview_url,
      architectureDoc: null,
      userId,
      lastDeployedAt: null,
      prodUrl: null,
    },
    buildPath: `/project/${project.project_id}/build?new_project=true&prompt=${encodeURIComponent(projectPrompt)}`,
  };
}

// Trigger dev image build on FastAPI server
export async function triggerDevImageBuild(
  projectId: string,
  userId: string,
  repoId: number | string,
) {
  try {
    console.log(projectId, userId, repoId, envConfig.aiServerUrl);
    const response = await axios.post(
      `${envConfig.aiServerUrl}/api/projects/${projectId}/build-dev-image`,
      {
        user_id: userId,
        repo_id: repoId,
        branch: "main",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
      },
    );

    // Axios: success = no throw
    console.log("✅ Dev image build triggered successfully");
    console.log("Status:", response.status);

    return;
  } catch (error) {
    console.error("Error triggering dev image build:", error);
    // Don't fail project creation if this fails
  }
}
