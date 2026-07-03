 
import { envConfig } from "@/app/lib/util/env-config";

import { SupabaseManagementCreateProject } from "@/app/lib/util/supabase/functions/management-api";
import { SupabaseManagementAPI } from "@/app/lib/util/supabase/management";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";
import { OauthPkceSchema } from "@/app/lib/util/supabase/types/tables";
import { NextRequest, NextResponse } from "next/server";

/**
 * @description Callback route after user project authorizes Supabase integration, updates project integration row
 * with the respective tokens. 
 * 1. Creates a supabase project under user's organization.
 * 2. 
 * @param req 
 * @returns 
 */
export async function GET(req: NextRequest) {
    try{
        const supabase = createSupabaseAdminClient();
        
        const url = new URL(req.url);
        const code = url.searchParams.get("code"); //Authorization code to exchange with supabase for access and refresh token
        const state = url.searchParams.get("state"); //State provided in connect oauth route
        
         
        if (!code || !state) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }
        
        // Look up code_verifier and metadata
        const { data } = await supabase.from("oauth_pkce")
        .select("*")
        .eq("id", state)
        .single<OauthPkceSchema>();

 
        //logger.info(data,"[src/app/api/oauth/callback/supabase]: PKCE State returned")
    
        if (!data) {
            return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
        }
    
        const { code_verifier: codeVerifier, redirect_uri: redirectUri, project_id: projectId, project_name: projectName } = data;
        
        // Exchange code for tokens with Supabase
        const tokenUrl = "https://api.supabase.com/v1/oauth/token";
        const clientId = process.env.OAUTH_SUPABASE_CLIENT_ID!
        const clientSecret = process.env.OAUTH_SUPABASE_CLIENT_SECRET!

        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri, // must match what you registered
            client_id: clientId,
            client_secret: clientSecret,
            code_verifier: codeVerifier,
        });
 
        const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: body.toString(),
        });
        
        if (!tokenRes.ok) {
            let errorText: string;
            try {
              const errData = await tokenRes.json();
              errorText = JSON.stringify(errData, null, 2);
            } catch {
              errorText = await tokenRes.text();
            }
            // logger.error({
            //     status: tokenRes.status,
            //     statusText: tokenRes.statusText,
            //     body: errorText
            // },"❌ Supabase token exchange failed")
 
            throw new Error(`Failed to retrieve tokens from Supabase. Response: ${errorText}`);
        }
        //logger.info(data,"[src/app/api/oauth/callback/supabase]: Successfully retrieved user Supabase tokens")
        
        const tokens = await tokenRes.json();
         
        // Calculate expiry timestamp (expires_in is usually in seconds)
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Store tokens securely in your DB 
        const {error:integrationError} = await supabase.from("project_integration")
        .update({
          status: "Completed",
          is_active: true,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_in: tokens.expires_in,
          token_expires_at: expiresAt
        })
        .eq("project_id", projectId)
        .eq("integration_id", data.integration_id)
        .select()
        .single();
        
        
        if(integrationError){
            throw new Error(`Error updating tokens in project integration ${integrationError.message}`) 
        }
        //logger.info(data,"[src/app/api/oauth/callback/supabase]: Successfully retrieved user Supabase tokens")
        
        
        //Get organization id of integrated 
        const supabaseM = new SupabaseManagementAPI(tokens.access_token)
        //Grab organization id 
        const orgs = await supabaseM.listOrganizations()
        const integratedOrg = orgs[0]
        
        await SupabaseManagementCreateProject({
            accessToken: tokens.access_token
            , integrationId: data.integration_id
            , orgId: integratedOrg.id
            , projectId
            , projectName
            , supabase
        })


        //Grab thread id to send back to redirected
        const { data:projectIntegrationData } = await supabase.from("project_integration")
        .select('*')
        .eq("project_id", projectId)
        .eq("integration_id", data.integration_id)
        .single();
        
        
        // return NextResponse.json(response);
        return NextResponse.redirect(`${envConfig.appBaseUrl}/integration/success?integrationName=${'Supabase'}&threadId=${projectIntegrationData["thread_id"]}`);
    }
    catch(err){
        //logger.error(err,"[src/app/api/oauth/callback/supabase]: Error")
        console.log(err)
        return NextResponse.json(
            { success: false, error: `Failed to process supabase OAuth callback. ${err}` },
            { status: 500 },
        );
    }
  }