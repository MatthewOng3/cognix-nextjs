export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { verifyProjectOwnership } from "@/app/lib/api/verifyProjectOwnership";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

const supabase = createSupabaseAdminClient();

async function probePreviewUrl(previewUrl: string) {
  try {
    const response = await fetch(previewUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    return {
      ready: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      ready: false,
      status: null as number | null,
      error: error instanceof Error ? error.message : "Preview probe failed",
    };
  }
}

export const GET = withAuth(async (request: NextRequest, user) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: "projectId is required" },
      { status: 400 },
    );
  }

  const authError = await verifyProjectOwnership(user.id, projectId);
  if (authError) return authError;

  const { data: project, error } = await supabase
    .from("project")
    .select("preview_url, dokku_app_name")
    .eq("project_id", projectId)
    .single();

  if (error || !project?.preview_url) {
    return NextResponse.json(
      { success: false, error: "Preview URL not found for project" },
      { status: 404 },
    );
  }

  const result = await probePreviewUrl(project.preview_url);

  return NextResponse.json({
    success: true,
    data: {
      ready: result.ready,
      status: result.status,
      appName: project.dokku_app_name,
      previewUrl: project.preview_url,
      error: "error" in result ? result.error : null,
    },
  });
});
