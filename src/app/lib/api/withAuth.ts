
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseUserClient } from "../util/supabase/server";
import { type User } from "@supabase/supabase-js";

/**
 * @description Function to grab user session data and validate with API request. 
 * Authentication purposes. 
 * @param request
 * @returns
 */
export async function getUserFromRequest(request: NextRequest) {
  const supabase = createSupabaseUserClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * @description Higher-order function for API route protection, runs before route function runs, which is passed into handler.
 * @param handler
 * @returns
 */
export function withAuth<T = Record<string, string>>(
  handler: (request: NextRequest, user: User, params?: T) => Promise<Response>,
) {
    return async (request: NextRequest, context: { params: Promise<T> }) => {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }

      // Await params here and pass the resolved value to your handler
      const resolvedParams = await context.params;

      return handler(request, user, resolvedParams);
    };
}
