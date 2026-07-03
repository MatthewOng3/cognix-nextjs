import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient, updateSession } from "@/app/lib/util/supabase/middleware";
import { getBetaStatus } from "@/app/lib/util/beta-gate";
import { createSupabaseAdminClient } from "./app/lib/util/supabase/server";

/**
 * @description Runs on every request to check if user is authenticated
 * @param request
 * @returns
 */
export async function proxy(request: NextRequest) {

  // Only apply the redirect logic on the root path
  if (request.nextUrl.pathname === "/") {
    const supabase = createSupabaseMiddlewareClient(request); // however you create it in middleware context

    const { data: { user } } = await supabase.auth.getUser();
  
    if (user) {
      // Fetch their most recently accessed project
      const { data: latestProject, error } = await supabase
        .from("project")
        .select("project_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) // or created_at, or last_opened_at
        .limit(1)
        .single();

      if (latestProject) {
        const url = request.nextUrl.clone();
        url.pathname = `/project/${latestProject.project_id}/build`;
        return NextResponse.redirect(url);
      } else {
        // Authenticated but no projects yet
        const url = request.nextUrl.clone();
        url.pathname = "/project";
        return NextResponse.redirect(url);
      }
    }

    // Not authenticated — show landing page normally
    return NextResponse.next();
  }
  // Public routes that don't require auth
  if (request.nextUrl.pathname === "/beta-full") {
    return NextResponse.next();
  }

  // When someone tries to access the register page, check if beta is open
  // if (request.nextUrl.pathname === "/auth/register") {
  //   const betaStatus = await getBetaStatus();
  //   if (!betaStatus.isOpen) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = "/beta-full";
  //     return NextResponse.redirect(url);
  //   }
  // }

  const result = await updateSession(request);

  return result;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (skip all API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
