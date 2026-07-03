import { type NextRequest, NextResponse } from "next/server";
import { SSEManager } from "@/app/lib/api/server_side_events";
import { githubService } from "@/app/lib/github";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import type { GithubWebhook } from "@/app/lib/util/types/github";
import type { SnapshotSSE } from "@/app/lib/util/types/sse";

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

// function verifyGitHubSignature(rawBody: Buffer, signature: string | undefined): boolean {
//   if (!signature) return false;
//   const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
//   hmac.update(rawBody);
//   const expected = `sha256=${hmac.digest('hex')}`;

//   try {
//     return crypto.timingSafeEqual(
//       Buffer.from(expected, 'utf8'),
//       Buffer.from(signature, 'utf8')
//     );
//   } catch {
//     return false;
//   }
// }

const blockedRepos = ["cognix", "cognix-ai-server"];
const supabase = createSupabaseAdminClient();

/**
 * @description API route to trigger snapshot generation of user's project app preview, when AI pushes new code
 * to Github or user forces a refresh.
 * @param request
 * @route /api/project_review/push_webhook
 * @returns Array buffer of the snapshot binary file to be mounted
 */
export const POST = async (request: NextRequest) => {
  try {
    // //TODO Change this to
    // const data: GithubWebhook = await request.json();

    // if (!data.repository) {
    //   const errorResponse: ApiResponse<null> = {
    //     success: false,
    //     error:
    //       "Error with Github webhook triggering snapshot build, no repository data present",
    //     data: null,
    //   };
    //   return NextResponse.json(errorResponse, { status: 400 });
    // }

    // //Make sure the repo that triggered the webhook is not our own code repo
    // if (!blockedRepos.includes(data.repository.name)) {
    //   const { data: ProjectData } = await supabase
    //     .from("project")
    //     .select("*")
    //     .eq("repo_id", data.repository.id.toString())
    //     .single();

    //   console.log(`Github Push Webhook Project Data: ${ProjectData}`);
    //   const projectId = ProjectData.project_id;
    //   const repoUrl = ProjectData.repo_url;

    //   //Generate new snapshot
    //   const newSnapshot = await githubService.generateSnapshot(
    //     projectId,
    //     repoUrl,
    //   );

    //   //Get latest snapshot to be mounted
    //   const snapshotBlob = await githubService.getSnapshot(projectId, repoUrl);

    //   if (!snapshotBlob) {
    //     const errorResponse: ApiResponse<null> = {
    //       success: false,
    //       error: "Error getting snapshot buffer",
    //       data: null,
    //     };
    //     return NextResponse.json(errorResponse, { status: 400 });
    //   }

    //   console.log(
    //     `After snapshot blob generated from Git Webhook`,
    //     snapshotBlob,
    //   );
    //   const ssePayload: SnapshotSSE = {
    //     type: "new-snapshot-ready",
    //     snapshotId: newSnapshot.id,
    //     projectId: newSnapshot.projectId,
    //     repoUrl,
    //     timestamp: new Date().toISOString(),
    //     // Note: NO binary data here - just metadata
    //   };
    //   // Send TEXT notification via SSE (not the binary data)
    //   const sseManager = SSEManager.getInstance();
    //   sseManager.broadcast(ssePayload);
    //   console.log(`SSE Text Event Successful`);
    // }

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
