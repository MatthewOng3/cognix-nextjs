import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { githubService } from "@/app/lib/github";
import type { ApiResponse } from "@/app/lib/util/types/api";

/**
 * @description API route to trigger snapshot generation of user's project app preview, when AI pushes new code
 * to Github or user forces a refresh.
 * @param request
 * @route /api/project_review
 * @returns Array buffer of the snapshot binary file to be mounted
 */
export const POST = withAuth(async (request ) => {
  try {
    const { projectId, repoUrl  } = await request.json();

    if (!projectId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "Project Id is required",
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    //Generate new snapshot
    await githubService.generateSnapshot(projectId, repoUrl);

    //Get latest snapshot to be mounted, returns raw file
    const snapshotBlob = await githubService.getSnapshot(projectId, repoUrl);

    if (!snapshotBlob) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "Error getting snapshot buffer",
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Return binary response instead of JSON
    return new NextResponse(snapshotBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        // 'Content-Length': snapshotBuffer.byteLength.toString(),
        //Add success indicator in headers
        "X-Success": "true",
      },
    });
  } catch (error) {
    console.error("Error generating snapshot:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Internal server error",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
});

// /**
//  * @description API route to retrieve snapshot
//  * @param request
//  * @route /api/project_review
//  * @returns
//  */
// export const GET = withAuth(async (request, user) => {
//     try {
//         const userId = user.id;
//         const { projectId, repoUrl  } = await request.json();

//         if (!projectId) {
//             const errorResponse: ApiResponse<null> = {
//                 success: false,
//                 error: "Project Id is required",
//                 data: null,
//             };
//             return NextResponse.json(errorResponse, { status: 400 });
//         }

//         //Get latest snapshot to be mounted
//         const snapshotBuffer = await githubService.getSnapshot(projectId, repoUrl)

//         if(!snapshotBuffer){
//             const errorResponse: ApiResponse<null> = {
//                 success: false,
//                 error: "Error getting snapshot buffer",
//                 data: null,
//             };
//             return NextResponse.json(errorResponse, { status: 400 });
//         }

//         const successResponse: ApiResponse<Blob> = {
//             success: true,
//             data: snapshotBuffer,
//             error: undefined,
//         };

//         return NextResponse.json(successResponse);
//     } catch (error) {
//         console.error("Error in GET route of  API Response:", error);
//         const errorResponse: ApiResponse<null> = {
//             success: false,
//             error: "Internal server error",
//             data: null,
//         };
//         return NextResponse.json(errorResponse, { status: 500 });
//     }
// });
