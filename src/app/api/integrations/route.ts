import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { ApiResponse } from "@/app/lib/util/types/api";
import { IntegrationResponse } from "@/app/project/[project_id]/integration/page";
import { NextResponse } from "next/server";



/**
 * @description Server side API route to fetch integrations for a project
 * @param request
 * @route api/integrations
 */
export const GET = withAuth(async (request) => {
    try {
        const supabase = createSupabaseAdminClient();
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        
        if (!projectId) {
            const errorResponse: ApiResponse<null> = {
                success: false,
                error: "Project ID is required",
                data: null,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }
    
        const { data, error } = await supabase.rpc("get_active_integrations", { project_id: projectId });

 
        if (error) {
            throw error;
        }
        
        const successResponse: ApiResponse<IntegrationResponse[]> = {
            success: true,
            data: data,
            error: undefined,
        };
    
        return NextResponse.json(successResponse);
    } catch (error) {
        console.error("Error fetching product document:", error);
    
        const errorResponse: ApiResponse<null> = {
            success: false,
            error: "Internal server error",
            data: null,
        };
    
        return NextResponse.json(errorResponse, { status: 500 });
    }
});