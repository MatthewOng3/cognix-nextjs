import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { envConfig } from "../env-config";

/**
 * @description Create supabase user client that uses the ANON key and grabs user cookies
 * @param request
 * @returns
 */
export function createSupabaseUserClient(request: NextRequest) {
  return createServerClient(
    envConfig.supabaseUrl,
    envConfig.supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
      },
    },
  );
}

/**
 * @description Create supabase admin client to handle DB logic mainly
 * @returns
 */
export function createSupabaseAdminClient() {
  return createClient(
    envConfig.supabaseUrl,
    envConfig.supabaseServiceKey, // Use service role key instead of anon key
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      }
    },
  );
}
 
