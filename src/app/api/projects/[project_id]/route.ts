import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import type { ProjectData } from "@/app/lib/redux/features/projectSlice";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import { ProjectUpdateData } from "@/app/project/[project_id]/plan/page";
import { verifyProjectOwnership } from "@/app/lib/api/verifyProjectOwnership";

const supabase = createSupabaseAdminClient();

/**
 * @description Server side API route to fetch all necessary project data based on project id
 * @param request
 * @returns
 */
export const GET = withAuth<{ project_id: string }>(
  async (request: NextRequest, user, params) => {
    try {
		// Await params before accessing properties (Next.js 15+ requirement)
		const resolvedParams = await params;
		const projectId = resolvedParams?.project_id;
		
		if (!user.id) {
			const errorResponse: ApiResponse<null> = {
			success: false,
			error: "User ID is required",
			data: null,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		//Verify if person making request for project data owns the project
		const authError = await verifyProjectOwnership(user.id, projectId);
		if (authError) return authError;

		const { data: projectData, error: projectError } = await supabase.rpc(
			"get_complete_project",
			{
				project_id_input: projectId,
			},
		);

		if (projectError) {
			console.error("Error fetching projects:", projectError);
			const errorResponse: ApiResponse<null> = {
			success: false,
			error: projectError.message,
			data: null,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		//Grab project production deployment data
		const { data: projectProductionDeployment, error: projectProductionDeploymentError } = await supabase
		.from("user_production_deployment")
		.select("last_deploy_at, prod_url") // only grab what you need
		.eq("project_id", projectId)
		.maybeSingle();
		
		 
		if (projectProductionDeploymentError) {
			console.error("Error fetching production deployment:", projectProductionDeploymentError);
		}

		const fullProjectData:ProjectData = {...projectData, lastDeployedAt: projectProductionDeployment?.last_deploy_at ?? null,
			prodUrl: projectProductionDeployment?.prod_url ?? null,}
	 
		const successResponse: ApiResponse<ProjectData> = {
			success: true,
			data: fullProjectData,
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
  },
);


/**
 * @description PUT route to dynamically update project columns depending on what is specified in the argument. 
 */
export const PUT = withAuth(async (request, user) => {
	try {
		const data:ProjectUpdateData = await request.json();
		const { project_id, ...columnsToUpdate } = data;

	
		if (!project_id || Object.keys(columnsToUpdate).length === 0) {
			return NextResponse.json(
				{ success: false, error: "Missing projectId or columns to update" },
				{ status: 400 }
			);
		}

		//Verify if person making request for project data owns the project
		const authError = await verifyProjectOwnership(user.id, project_id);
		if (authError) return authError;

		const { error } = await supabase
		.from("project")
		.update(columnsToUpdate)
		.eq("project_id", project_id);

		if (error) {
			return NextResponse.json(
				{ success: false, error: error.message },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true, data: null });
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
});
