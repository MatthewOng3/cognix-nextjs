import { verifyProjectOwnership } from "@/app/lib/api/verifyProjectOwnership";
import { withAuth } from "@/app/lib/api/withAuth";
import { envConfig } from "@/app/lib/util/env-config";
import { ApiResponse } from "@/app/lib/util/types/api";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Trigger docker build and deploy user app to production
 * @param request
 * @returns
 */
export const POST = withAuth(
async (request: NextRequest, user) => {
    try {
        const { projectId, chatSessionId } = await request.json();

        // Verify if person making request for project data owns the project
        const authError = await verifyProjectOwnership(user.id, projectId);
        if (authError) return authError;

        const response = await fetch(
            `${envConfig.aiServerUrl}/api/user_project/deploy`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    project_id: projectId,
                    chat_session_id: chatSessionId
                }),
            }   
        );
        const deployData = await response.json();
        
        // Check body success flag regardless of HTTP status
        if (!response.ok || !deployData.success) {
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: deployData?.error ?? `Deploy failed with status ${response.status}`,
                data: null,
            };
            return NextResponse.json(errorResponse, { status: response.ok ? 500 : response.status });
        }
        
        const successResponse: ApiResponse<{ url?: string, last_deployed_at?: string }> = {
            success: true,
            error: "",
            data: {
                url: deployData?.data.url ?? null,
                last_deployed_at: deployData?.data.last_deployed_at ?? null,
            },
        };

        return NextResponse.json(successResponse, { status: 200 });
    } catch (error) {
        console.error("Error in publish user app route:", error);
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: `Production Deployment Error ${error}`,
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
});