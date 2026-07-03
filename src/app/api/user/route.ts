import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import type { UserRedux } from "@/app/lib/redux/features/userSlice";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import type { ApiResponse } from "@/app/lib/util/types/api";

const supabase = createSupabaseAdminClient();

/**
 * @description Server side API route to grab user data from database
 * @param request
 * @route /api/user
 * @returns Single user row
 */
export const GET = withAuth(async (request, user) => {
  try {
    const userId = user.id;

    if (!userId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: "User ID is required",
        data: null,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const query = supabase
      .from("user")
      .select(
        "plan_id, is_premium, last_login, created_at, completed_onboarding, onboarding_state, onboarding_route, credit_balance",
      )
      .eq("user_id", userId)
      .select()
      .single();

    const { data: user_data, error: user_error } = await query;

    if (user_error) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: user_error.message,
        data: null,
      };

      return NextResponse.json(errorResponse, { status: 400 });
    }

    const successResponse: ApiResponse<UserRedux> = {
      success: true,
      data: user_data, //Data returned from supabase
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
