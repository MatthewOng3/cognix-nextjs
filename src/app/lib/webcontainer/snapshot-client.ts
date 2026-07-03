// app/lib/webcontainer/snapshot-client.ts
/**
 * Centralized client for calling Python snapshot API
 * Use this from any Next.js route that needs to generate snapshots
 */

import { envConfig } from "@/app/lib/util/env-config";

interface GenerateSnapshotParams {
  projectId: string;
  userId: string;
  repoId: number;
  forceRegenerate?: boolean;
}

interface SnapshotResult {
  success: boolean;
  projectId: string;
  storagePath?: string;
  sizeBytes?: number;
  depsHash?: string;
  error?: string;
}


export class SnapshotClient {
  private static baseUrl = envConfig.aiServerUrl || 'http://localhost:8000';
  
  /**
   * Generate snapshot via Python API
   */
  static async generateSnapshot(
    params: GenerateSnapshotParams
  ): Promise<SnapshotResult> {
    try {
      console.log(`📦 [SnapshotClient] Generating snapshot for ${params.projectId}`);
      
      const response = await fetch(
        `${this.baseUrl}/api/webcontainer/snapshot/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: params.projectId,
            user_id: params.userId,
            repo_id: params.repoId,
            force_regenerate: params.forceRegenerate || false,
          }),
          signal: AbortSignal.timeout(60000), // 60s timeout
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [SnapshotClient] API error:`, errorText);
        
        return {
          success: false,
          projectId: params.projectId,
          error: `API returned ${response.status}`,
        };
      }

      const result = await response.json();
      console.log(`✅ [SnapshotClient] Snapshot generated:`, result);
      
      return {
        success: result.success,
        projectId: result.project_id,
        storagePath: result.storage_path,
        sizeBytes: result.size_bytes,
        depsHash: result.deps_hash,
        error: result.error,
      };
      
    } catch (error) {
      console.error(`❌ [SnapshotClient] Error:`, error);
      
      return {
        success: false,
        projectId: params.projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Check if snapshot exists
   */
  static async checkExists(projectId: string): Promise<{
    exists: boolean;
    metadata?: {
      depsHash?: string;
      createdAt?: string;
      sizeBytes?: number;
    };
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/webcontainer/snapshot/exists/${projectId}`
      );
      
      if (!response.ok) {
        return { exists: false };
      }
      
      const result = await response.json();
      return {
        exists: result.exists,
        metadata: result.metadata,
      };
      
    } catch (error) {
      console.error(`❌ [SnapshotClient] Check failed:`, error);
      return { exists: false };
    }
  }
  
  /**
   * Ensure snapshot exists (generate if missing)
   */
  static async ensureExists(
    projectId: string,
    userId: string,
    repoId: number
  ): Promise<SnapshotResult> {
    // First check if it exists
    const check = await this.checkExists(projectId);
    
    if (check.exists) {
      console.log(`⏭️  [SnapshotClient] Snapshot already exists for ${projectId}`);
      return {
        success: true,
        projectId,
        depsHash: check.metadata?.depsHash,
        sizeBytes: check.metadata?.sizeBytes,
      };
    }
    
    // Generate if missing
    console.log(`🔨 [SnapshotClient] Generating missing snapshot for ${projectId}`);
    return this.generateSnapshot({ projectId, userId, repoId });
  }
}

/**
 * Usage examples:
 * 
 * // In project creation:
 * await SnapshotClient.generateSnapshot({
 *   projectId,
 *   userId,
 *   repoId,
 * });
 * 
 * // In snapshot retrieval:
 * const result = await SnapshotClient.ensureExists(
 *   projectId,
 *   userId,
 *   repoId
 * );
 * 
 * if (!result.success) {
 *   throw new Error(result.error);
 * }
 * 
 * // In migration:
 * for (const project of projects) {
 *   await SnapshotClient.generateSnapshot({
 *     projectId: project.id,
 *     userId: project.user_id,
 *     repoId: project.repo_id,
 *   });
 * }
 */