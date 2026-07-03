import { envConfig } from "../env-config";
import { createSupabaseClient } from "../supabase/client";
import { sanitizeNextPath } from "./redirect";

export type AuthProvider = "google" | "github";

export async function signInWithProvider(
  provider: AuthProvider,
  nextPath?: string,
) {
  const supabase = createSupabaseClient();
  const safeNextPath = sanitizeNextPath(nextPath);

  // OAuth provider login
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${envConfig.appBaseUrl}/auth/callback/oauth?next=${encodeURIComponent(
        safeNextPath,
      )}`,
    },
  });

  if (error) throw error;
}
