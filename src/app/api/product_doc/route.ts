import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";
import { Project } from "@/app/lib/util/supabase/types/tables";

const supabase = createSupabaseAdminClient();

/**
 * @description Server side API route to create a new product doc if none exists.
 * @param request Contains projectId and document info as a Json Array
 * @returns
 */
// export async function POST(request: NextRequest) {
//   try {
//     const { projectId, docContentJson } = await request.json();

//     // Create new product doc for a project
//     const { data: product_doc_data, error: product_doc_error } = await supabase
//       .from("product_doc")
//       .insert({
//         project_id: projectId,
//         document_json: docContentJson,
//       })
//       .select()
//       .single(); // Use single() to get one row and proper typing

//     //If error creating new product doc happens
//     if (product_doc_error) {
//       console.error("Error creating project:", product_doc_error);

//       const error_response: ApiResponse<null> = {
//         success: false,
//         error: product_doc_error.message,
//         data: null,
//       };

//       return NextResponse.json(error_response, { status: 400 });
//     }

//     // Success response
//     const successResponse: ApiResponse<null> = {
//       success: true,
//       data: null,
//       error: undefined,
//     };

//     return NextResponse.json(successResponse);
//   } catch (error) {
//     console.error("Error in project creation:", error);
//     const errorResponse: ApiResponse<null> = {
//       success: false,
//       error: "Internal server error",
//       data: null,
//     };

//     return NextResponse.json(errorResponse, { status: 500 });
//   }
// }

/**
 * @description Server side API route to fetch saved info for a product doc
 * @param request
 * @returns All rows in product_doc table
 */
export const GET = withAuth(async (request ) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

 

    if (!projectId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "Project ID is required",
        data: null,
      };
      console.warn("[GET] Missing projectId");
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const query = supabase
      .from("project")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    
    const { data: product_doc_data, error: product_doc_error } = await query;
 
    if (product_doc_error) {
      console.error("Error fetching product document:", product_doc_error);

      const errorResponse: ApiResponse<null> = {
        success: false,
        error: product_doc_error.message,
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const successResponse: ApiResponse<Project> = {
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

/**
 * @description Put request to update a document_json column
 * @param request
 * @returns
 */
export const PUT = withAuth(async (request) => {
  try {
    const { projectId, documentJson } = await request.json();
	
    if (!projectId || !documentJson) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing projectId or documentJson",
        },
        { status: 400 },
      );
    }

    // Upsert: update if exists, insert if not
    const { error } = await supabase
      .from("project")
      .update({ document_json: documentJson })
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    const successResponse: ApiResponse<null> = {
      success: true,
      data: null,
      error: undefined,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
