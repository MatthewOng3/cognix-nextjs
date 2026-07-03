import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";

const supabase = createSupabaseAdminClient();

/**
 * @description Server side API route to update onboarding state
 * @param request
 * @route /api/user/onboarding
 * @returns Single user row
 */
export const PUT = withAuth(async (request, user) => {
  try {
    const { onboarding_state, onboarding_route, completed_onboarding } =
      await request.json();

    const userId = user.id;

    if (!userId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "User ID is required",
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("user")
      .update({
        onboarding_state,
        onboarding_route,
        completed_onboarding,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: updateError.message,
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const successResponse: ApiResponse<null> = {
      success: true,
      data: null, //Data returned from supabase
      error: undefined,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error fetching user information:", error);

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: "Internal server error",
      data: null,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
});
