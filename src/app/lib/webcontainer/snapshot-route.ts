import { envConfig } from "../util/env-config";

/**
 * Helper: Get snapshot metadata from database
 */
export async function getSnapshotMetadata(supabase: any, projectId: string) {
    const { data: metadata, error } = await supabase
      .from("project_webcontainer_snapshots")
      .select("storage_path, deps_hash, size_bytes, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !metadata) {
      return null;
    }
    
    return metadata;
  }
  
  /**
   * Helper: Call Python API to generate snapshot
   */
  export async function generateSnapshotViaPython(
    projectId: string,
    userId: string,
    repoId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pythonApiUrl = envConfig.aiServerUrl || 'http://localhost:8000';
      
      console.log(`🔗 [Snapshot Route] Calling Python API: ${pythonApiUrl}/api/webcontainer/snapshot/generate`);
      
      const response = await fetch(
        `${pythonApiUrl}/api/webcontainer/snapshot/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            user_id: userId,
            repo_id: repoId,
            force_regenerate: false,
          }),
          // Timeout after 60 seconds
          //signal: AbortSignal.timeout(60000),
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ [Snapshot Route] Python API error:`, error);
        return { 
          success: false, 
          error: `Python API returned ${response.status}` 
        };
      }
      
      const result = await response.json();
      console.log(`✅ [Snapshot Route] Python API response:`, result);
      
      return result;
      
    } catch (error) {
      console.error(`❌ [Snapshot Route] Failed to call Python API:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Notify clients about new snapshots
 * Called by the webhook when AI finishes building
 */
export function notifySnapshotReady(
    projectId: string,
    depsHash?: string
  ) {
    const projectConnections = connections.get(projectId);
    
    if (!projectConnections || projectConnections.size === 0) {
      console.log(`⚠️  No active connections for project: ${projectId}`);
      return;
    }
  
    const data = JSON.stringify({
      type: "snapshot-ready",
      projectId,
      depsHash: depsHash || null,
      timestamp: new Date().toISOString(),
    });
  
    console.log(`📤 Notifying ${projectConnections.size} client(s) about new snapshot`);
  
    let successCount = 0;
    let failureCount = 0;
  
    projectConnections.forEach((controller) => {
      try {
        controller.enqueue(`data: ${data}\n\n`);
        successCount++;
      } catch (error) {
        console.error("❌ Failed to send SSE message:", error);
        projectConnections.delete(controller);
        failureCount++;
      }
    });
  
    console.log(`✅ SSE notification complete: ${successCount} sent, ${failureCount} failed`);
  }