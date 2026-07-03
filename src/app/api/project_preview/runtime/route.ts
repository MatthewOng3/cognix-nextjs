export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";
import { verifyProjectOwnership } from "@/app/lib/api/verifyProjectOwnership";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import {
  heartbeatPreviewLease,
  registerPreviewLease,
  unregisterPreviewLease,
} from "@/app/lib/server/preview-presence";
import {
  startDokkuPreviewApp,
  stopDokkuPreviewApp,
} from "@/server/dokku/dokku-preview-runtime";

type PreviewRuntimeAction = "start" | "heartbeat" | "stop";

const supabase = createSupabaseAdminClient();

async function startPreviewApp(appName: string) {
  await startDokkuPreviewApp(appName);
}

async function stopPreviewApp(appName: string) {
  await stopDokkuPreviewApp(appName);
}

/**
 * @description
 */
export const POST = withAuth(async (request: NextRequest, user) => {
  const { projectId, leaseId, action } = (await request.json()) as {
    projectId?: string;
    leaseId?: string;
    action?: PreviewRuntimeAction;
  };

  if (!projectId || !leaseId || !action) {
    return NextResponse.json(
      { success: false, error: "projectId, leaseId, and action are required" },
      { status: 400 },
    );
  }

  const authError = await verifyProjectOwnership(user.id, projectId);
  if (authError) return authError;

  const { data: project, error } = await supabase
    .from("project")
    .select("dokku_app_name, preview_url")
    .eq("project_id", projectId)
    .single();

  if (error || !project?.dokku_app_name) {
    return NextResponse.json(
      { success: false, error: "Preview app not configured for this project" },
      { status: 404 },
    );
  }

  try {
    console.log("[preview-runtime-api] request", {
      action,
      projectId,
      leaseId,
      appName: project.dokku_app_name,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    let result: { activeLeases: number };
	
    if (action === "start") {
      result = await registerPreviewLease({
        projectId,
        leaseId,
        appName: project.dokku_app_name,
        startApp: startPreviewApp,
        stopApp: stopPreviewApp,
      });
    } else if (action === "heartbeat") {
      result = await heartbeatPreviewLease({
        projectId,
        leaseId,
        appName: project.dokku_app_name,
        stopApp: stopPreviewApp,
      });
    } else {
      result = await unregisterPreviewLease({
        projectId,
        leaseId,
        appName: project.dokku_app_name,
        stopApp: stopPreviewApp,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        activeLeases: result.activeLeases,
        previewUrl: project.preview_url,
      },
    });
  } catch (runtimeError) {
    console.error("[preview-runtime-api] error", {
      action,
      projectId,
      leaseId,
      appName: project.dokku_app_name,
      error: runtimeError instanceof Error ? runtimeError.message : runtimeError,
      timestamp: new Date().toISOString(),
    });

    const message =
      runtimeError instanceof Error
        ? runtimeError.message
        : "Failed to control Dokku preview runtime";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
});
