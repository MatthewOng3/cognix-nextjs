import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/api/withAuth";

import type { ApiResponse } from "@/app/lib/util/types/api";
import { generatePKCE } from "@/app/lib/util/functions/pkce";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { IntegrationSchema } from "@/app/lib/util/supabase/types/tables";
import { envConfig } from "@/app/lib/util/env-config";
// import { logger } from "@/app/lib/util/logger";

/**
 * @description Route requested when user clicks connect to supabase in frontend to begin OAUTH integration. 
 * Creates a code verifier and challenge to be used as part of the authorization and request 
 * to authorize supabase through OAuth
 * @see SupabaseIntegrationLogin
 */
export const POST = withAuth(async (request: NextRequest ) => {
  try {
    const { projectId, integrationName, projectName  } = await request.json();
    const supabase = createSupabaseAdminClient();

    const baseURL = envConfig.appBaseUrl
    
    //Redirect uri for supabase to request after authorization happens
    const redirectUri = `${baseURL}/api/oauth/callback/supabase`;

    
    // Grab integration id through integration name
    const { data: integration, error: integrationError } = await supabase
      .from("integration")
      .select("*")
      .eq("service_name", integrationName)
      .single<IntegrationSchema>();

    if (integrationError || !integration) {
      throw new Error("Failed to find matching integration name in integration table");
    }

    // 🔎 Check if PKCE row already exists for this project + integration
    const { data: existingPkce  } = await supabase
      .from("oauth_pkce")
      .select("*")
      .eq("project_id", projectId)
      .eq("integration_id", integration.integration_id)
      .maybeSingle();

    //logger.info(existingPkce,"[src/app/api/oauth/connect/supabase]: Existing pkce found")
    
    let codeVerifier: string;
    let codeChallenge: string;
    let state: string;

    if (existingPkce) {
      // ✅ Reuse existing verifier
      codeVerifier = existingPkce.code_verifier;
      // Must recompute challenge since it's derived from verifier
      const { codeChallenge: existingChallenge } = generatePKCE(codeVerifier);
      codeChallenge = existingChallenge;
      state = existingPkce.id; // reuse the same state id
    } else {
        // ❌ No existing row → generate new PKCE pair
        const pkce = generatePKCE();
        codeVerifier = pkce.codeVerifier;
        codeChallenge = pkce.codeChallenge;
        state = crypto.randomBytes(16).toString("hex");
        //Insert new oauth pkce row
        const { error: pkceInsertError } = await supabase.from("oauth_pkce").insert({
            id: state,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
            project_id: projectId,
            integration_id: integration.integration_id,
            project_name: projectName,
        });

      if (pkceInsertError) {
        //logger.error(pkceInsertError,"[src/app/api/oauth/connect/supabase]: Failed to insert PKCE state")
        
        throw new Error("Failed to save PKCE state");
      }
    }

    const params = new URLSearchParams({
      client_id: process.env.OAUTH_SUPABASE_CLIENT_ID!,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    const authorizeUrl = `https://api.supabase.com/v1/oauth/authorize?${params}`;

    const response: ApiResponse<{ url: string }> = {
      success: true,
      data: { url: authorizeUrl },
      error: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { success: false, error: `Failed to connect to OAuth Supabase: ${error}` },
      { status: 500 }
    );
  }
});
