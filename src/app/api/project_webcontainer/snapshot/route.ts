// app/api/project_webcontainer/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { generateSnapshotViaPython, getSnapshotMetadata } from "@/app/lib/webcontainer/snapshot-route";

/**
 * Smart snapshot retrieval:
 * 1. Check if snapshot exists
 * 2. If not, trigger generation via Python API
 * 3. Return snapshot binary data
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    
    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    
    console.log(`📥 [Snapshot Route] Fetching snapshot for: ${projectId}`);
    
    // ============================================
    // STEP 1: Check if snapshot exists
    // ============================================
    let metadata = await getSnapshotMetadata(supabase, projectId);
    
    // ============================================
    // STEP 2: Generate if missing
    // ============================================
    if (!metadata) {
        console.log(`⚠️  [Snapshot Route] No snapshot found, generating...`);
        
        // Get project details to generate snapshot
        const { data: project } = await supabase
            .from("project")
            .select("user_id, repo_id")
            .eq("project_id", projectId)
            .single();
        
        if (!project) {
            return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
            );
        }
        
        // Call Python API to generate snapshot
        const generated = await generateSnapshotViaPython(
            projectId,
            project.user_id,
            project.repo_id
        );
        
        if (!generated.success) {
            return NextResponse.json(
            { error: generated.error || "Failed to generate snapshot" },
            { status: 500 }
            );
        }
        
        // Fetch the newly created snapshot metadata
        metadata = await getSnapshotMetadata(supabase, projectId);
        
        if (!metadata) {
            return NextResponse.json(
            { error: "Snapshot generation succeeded but metadata not found" },
            { status: 500 }
            );
        }
        
        console.log(`✅ [Snapshot Route] Snapshot generated on-demand`);
    }
    
    // ============================================
    // STEP 3: Download and return snapshot
    // ============================================
    console.log(`📋 [Snapshot Route] Snapshot metadata:`, {
      path: metadata.storage_path,
      hash: metadata.deps_hash,
      size: `${(metadata.size_bytes / 1024).toFixed(2)} KB`,
    });
    
    // Download snapshot from Supabase Storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from("app-snapshots")
      .download(metadata.storage_path);
    
    if (downloadError || !blob) {
      console.error("Download error:", downloadError);
      return NextResponse.json(
        { error: "Failed to download snapshot" },
        { status: 500 }
      );
    }

	// ✅ Return as JSON
	const jsonText = await blob.text();
    
    console.log(`✅ [Snapshot Route] Snapshot retrieved: ${blob.size} bytes`);

    // Return binary data with metadata headers
    return new Response(jsonText, {
      status: 200,
      headers: {
		"Content-Type": "application/json",  // ← JSON, not binary
		"X-Deps-Hash": metadata.deps_hash || "",
	  },
    });
    
  } catch (error) {
    console.error("❌ [Snapshot Route] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}