import { createSupabaseAdminClient } from "./supabase/server";


export async function waitForDokkuReady(projectId: string, maxWaitMs = 120000) {
    const supabase = createSupabaseAdminClient();
    const interval = 3000;
    const maxAttempts = maxWaitMs / interval;
    
    for (let i = 0; i < maxAttempts; i++) {
      const { data } = await supabase
        .from('project')
        .select('dokku_status')
        .eq('project_id', projectId)
        .single();
      
      if (data?.dokku_status === 'ready') return true;
      if (data?.dokku_status === 'failed') throw new Error('Dokku setup failed');
      
      console.log(`Waiting for Dokku to be ready... (${i + 1}/${maxAttempts})`);
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error('Timed out waiting for Dokku to be ready');
}