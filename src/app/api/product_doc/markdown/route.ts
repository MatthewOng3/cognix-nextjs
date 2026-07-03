import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";

const supabase = createSupabaseAdminClient();

/**
 * @description Grab markdown doc from product_doc table
 * @param request
 * @returns
 */
export const GET = withAuth(async (request ) => {
	try {
		const { searchParams } = new URL(request.url);
		const project_id = searchParams.get("project_id");

		if (!project_id) {
			const errorResponse: ApiResponse<null> = {
				success: false,
				error: "Project ID is required",
				data: null,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const query = supabase
		.from("project")
		.select("document_markdown")
		.eq("project_id", project_id)
		.order("created_at", { ascending: false });

		const { data: product_doc_data, error: product_doc_error } = await query;

		if (product_doc_error) {
			console.error("Error fetching markdown document:", product_doc_error);
			
			const errorResponse: ApiResponse<null> = {
				success: false,
				error: product_doc_error.message,
				data: null,
			};

			return NextResponse.json(errorResponse, { status: 400 });
		}

		const successResponse: ApiResponse<{ document_markdown: string }> = {
		success: true,
		data: product_doc_data[0], //Data returned from supabase
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
