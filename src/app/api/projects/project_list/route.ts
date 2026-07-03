import { withAuth } from "@/app/lib/api/withAuth";
import { ProjectInfo } from "@/app/lib/redux/features/projectSlice";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { ApiResponse } from "@/app/lib/util/types/api";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Server side API route to fetch all projects for a user. Project info is condesed
 * @param request
 * @returns
 */
export const GET = withAuth(async (request: NextRequest, user) =>  {
    try {
    
        const userId = user.id;
        const supabase = createSupabaseAdminClient();

        if (!userId) {
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: "User ID is required",
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const { data: projectList, error: projectsError } = await supabase
        .from("project")
        .select(`project_name, project_id, created_at, status`)
        .eq("user_id", userId);

        if (projectsError) {
            console.error("Error fetching projects:", projectsError);
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: projectsError.message,
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }
        
        const list: ProjectInfo[] = (projectList ?? []).map((obj) => ({
            projectName: obj.project_name,
            projectId: obj.project_id,
            createdAt: obj.created_at,
            status: obj.status,
        }));
        
        const successResponse: ApiResponse<ProjectInfo[]> = {
            success: true,
            data: list
        };

        return NextResponse.json(successResponse);
    } catch (error) {
        console.error("Error fetching project list:", error);
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: "Internal server error regarding route /api/projects/project_list",
            data: null,
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
})

