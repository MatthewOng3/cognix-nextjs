import { type NextRequest, NextResponse } from "next/server";
import { sseManager } from "@/app/lib/api/server_side_events";
import { githubService } from "@/app/lib/github";
import type { ApiResponse } from "@/app/lib/util/types/api";
import type { SnapshotSSE } from "@/app/lib/util/types/sse";

/**
 * @description API route from AI server after developer agent pushes to Github to redeploy snapshot, Non webhook method.
 * Might use this instead as what if developer agent makes multiple pushes to Github, we only want this to trigger after
 * @param request
 * @route /api/project_review/ai_trigger
 * @returns Array buffer of the snapshot binary file to be mounted
 */
export const POST = async (request: NextRequest) => {
  try {
    //Data sent from ai server, after the agent uses the tool to edit github files and push commit
    const { projectId, repoUrl } = await request.json();

    // if(!data.repository){
    // 	const errorResponse: ApiResponse<null> = {
    //         success: false,
    //         error: "Error with Github webhook triggering snapshot build, no repository data present",
    //         data: null,
    //     };
    //     return NextResponse.json(errorResponse, { status: 400 });
    // }

    // const {data: ProjectData } = await supabase.from('project')
    // 	.select('*').eq('repo_id', data.repository.id.toString()).single();

    //Generate new snapshot
    const newSnapshot = await githubService.generateSnapshot(
      projectId,
      repoUrl,
    );

    //Get latest snapshot to be mounted
    const snapshotBlob = await githubService.getSnapshot(projectId, repoUrl);

    if (!snapshotBlob) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "Error getting snapshot buffer",
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`After snapshot blob generated from Git Webhook`, snapshotBlob);
    const ssePayload: SnapshotSSE = {
      type: "new-snapshot-ready",
      snapshotId: newSnapshot.id,
      projectId: newSnapshot.projectId,
      repoUrl,
      timestamp: new Date().toISOString(),
      // Note: NO binary data here - just metadata
    };

    // Send TEXT notification via SSE (not the binary data)
    console.log("BEFORE BROADCASTING");
    sseManager.broadcastToProject(projectId, ssePayload);

    console.log(`SSE Text Event Successful`);
    const successResponse: ApiResponse<null> = {
      success: true,
      data: null,
      error: undefined,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Error triggering snapshot from Github webhook:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Internal server error",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
};
