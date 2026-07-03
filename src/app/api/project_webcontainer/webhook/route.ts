// app/api/webcontainer/webhook/route.ts
import { notifySnapshotReady } from "@/app/lib/webcontainer/snapshot-route";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Receives a request from python fast api AI server that will trigger the SSE event to notify frontend to update snapshot
 * @param request 
 * @returns 
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, depsHash } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    console.log(`📨 Webhook: New snapshot ready for project ${projectId}`);
    if (depsHash) {
      console.log(`   Deps hash: ${depsHash}`);
    }

    // Notify all connected SSE clients
    notifySnapshotReady(projectId, depsHash);

    return NextResponse.json({ 
        success: true,
        message: "Clients notified",
        projectId,
        depsHash
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}