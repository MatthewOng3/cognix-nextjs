"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./types/tables";
import { envConfig } from "../env-config";

// Browser client
let browserClient: SupabaseClient<Database> | null = null;

export function createSupabaseClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;
  
  browserClient = createBrowserClient(
    envConfig.supabaseUrl,  
    envConfig.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        
      }
    },
  );

  return browserClient;
}
