// app/lib/api/verifyProjectOwnership.ts
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { NextResponse } from "next/server";
import { envConfig } from "../util/env-config";

const supabase = createSupabaseAdminClient();
const ADMIN_USER_ID = envConfig.adminUserId;

/**
 * @description Verifies that the requesting user owns the project, or is an admin.
 * Returns an error NextResponse if unauthorized, or null if the check passes.
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string | undefined
): Promise<NextResponse | null> {
  if(!projectId) return null
  // Admin can access anything
  if (userId === ADMIN_USER_ID) return null;

  const { data: project, error } = await supabase
    .from("project")
    .select("user_id")
    .eq("project_id", projectId)
    .single();

  if (error || !project) {
    return NextResponse.json(
      { success: false, error: "Project not found", data: null },
      { status: 404 }
    );
  }

  if (project.user_id !== userId) {
    return NextResponse.json(
      { success: false, error: "Forbidden", data: null },
      { status: 403 }
    );
  }

  return null; // passed
}