/* eslint-disable */
"use server"
import { SupabaseClient } from "@supabase/supabase-js";
import { CreateProjectBody, CreateProjectResponse, SupabaseKeys, SupabaseManagementAPI } from "../management";
import { githubService, SecretItem } from "@/app/lib/github";
import { createVaultSecrets } from "./vault-secrets";

import { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from "../constants";
import { Project } from "../types/tables";
import { decrypt, encrypt } from "../../functions/crypto";
import { waitForDokkuReady } from "../../dokku-wait";

//Metadata stored in project_integration table
type SupabaseProjectIntegrationMetadata = CreateProjectResponse & {
    project_url: string; 
    db_encrypted_password: string;
    connection_string: string;
    db_raw?: string
};

type CreateProjectArgs = {
    supabase: SupabaseClient<any, any>,
    projectId: string, //Project ID of their cognix project not supabase
    integrationId: string,
    orgId: string,
    projectName: string,
    accessToken: string
}

/**
 * @description Create a project for user under their integrated organization using supabase management api. 
 * Additionally fetch their API secrets to be saved in the project repository secrets so we can use as ENV variables. 
 * @see api-oauth-callback-supabase-route.ts
 * @returns 
 */
export async function SupabaseManagementCreateProject(args: CreateProjectArgs){
    
    try {
        const {supabase, projectId, integrationId, orgId, projectName, accessToken} = args 
        const supabaseM = new SupabaseManagementAPI(accessToken)

        if (!accessToken || !integrationId) {
            throw new Error('No access token or integration id argument');
        }

		//First check if supabase project for user's cognix project has not been created under the org as we don't want to create another one
		const { data } = await supabase
        .from("project_integration")
        .select("metadata, repo_id")
        .eq("project_id", projectId)
        .eq("integration_id", integrationId)
        .single<{
            metadata: SupabaseProjectIntegrationMetadata | null;
            repo_id: number | null;
        }>();
        
		const integrationMetadata = data?.metadata;
		if (integrationMetadata?.id) {
            //logger.info(data,"[src/app/lib/util/supabase/functions]: Supabase project already created, skipping...")
			return integrationMetadata;
		}

        const {data: cognixProject} = await supabase
        .from("project")
        .select('*')
        .eq("project_id", projectId)
        .single<Project>()

        if(!cognixProject?.project_id){
            throw new Error("Error retrieving project data")
        }

        // ===== Set up User Supabase Project =====
        // Generate password
        const dbPassword = crypto.randomUUID().replace(/-/g, ""); 
        const encryptedPassword = encrypt(dbPassword)
        
		//If cognix supabase project has not been created yet, create new one
        const region = 'us-east-1' //Might have to geographically figure out which region they are in
        const reqProjectBody:CreateProjectBody = {
            name: projectName,
            organization_id: orgId,
            db_pass: dbPassword,
            region
        }

        // 1. Create the project and set important variables
        const projectData = await supabaseM.createProject(reqProjectBody)
        if (!projectData) {
            throw new Error(`Project creation failed`);
        }

        const projectRef = projectData.id
        const projectUrl = `https://${projectRef}.supabase.co`
        
        //====== Get Supabase Connection URL =======
        const poolerConfigs = await supabaseM.getDbConnectionPooler(projectRef)
        const connectionConfig = poolerConfigs[0]
        
		//Store created project data into project integration table metadata
		const metadata: SupabaseProjectIntegrationMetadata = {
			...projectData, project_url: projectUrl
            , db_encrypted_password: encryptedPassword
            , connection_string: connectionConfig.connection_string
		}
		
		const supabaseDashboardProjectUrl = `https://supabase.com/dashboard/project/${projectRef}`
        
		const{ error: metadataError  }= await supabase
		.from("project_integration")
		.update({metadata,
            service_project_id: projectRef,
            service_dashboard_url: supabaseDashboardProjectUrl,
            updated_at: new Date().toISOString()
        })
		.eq("project_id", projectId)
		.eq("integration_id", integrationId)
		.single();

		if(metadataError){
			throw Error(`Error updating project integration metadata for supabase: ${metadataError}`)
		}

        // 4. Fire off secret provisioning in the background — caller can redirect immediately after this function returns
        provisionProjectSecrets({
            supabaseM,
            supabase,
            projectRef,
            projectUrl,
            projectId,
            integrationId,
            dokkuAppName: cognixProject.dokku_app_name,
            repoId: Number(data?.repo_id)
        }).catch(err => {
            console.error("[SupabaseManagementCreateProject]: Background secret provisioning failed", err)
            //logger.error(err, "[SupabaseManagementCreateProject]: Background secret provisioning failed")
        })

        return metadata
	} catch (err: any) {
        console.log(err)
        //logger.error(err,"[src/app/lib/util/supabase/functions]: Error in SupabaseManagementCreateProject")
        return  
	}
}

/**
 * @description Converts SupabaseKeys into a SecretItem with proper naming for GitHub secrets
 * 
 */
function supabaseKeyToGitSecret(key: SupabaseKeys): SecretItem {
    let secretName: string;
    
    switch (key.id) {
      case "service_role":
        secretName = SUPABASE_SERVICE_KEY;
        break;
      case "anon":
        secretName = SUPABASE_ANON_KEY;
        break;
      default:
        // fallback to the key's name or id if unknown
        secretName = key.name || key.id;
    }
  
    return {
      secretName,
      secretValue: key.api_key || undefined,
    };
}

/**
 * Converts SupabaseKeys into a SecretItem with proper naming for Vault Secrets
 */
function supabaseKeyToVaultSecret(key: SupabaseKeys, projectId: string): SecretItem {
    let secretSuffix: string;

    switch (key.id) {
      case "service_role":
        secretSuffix = NEXT_SUPABASE_SERVICE_KEY;
        break;
      case "anon":
        secretSuffix = NEXT_PUBLIC_SUPABASE_ANON_KEY;
        break;
      default:
        // fallback to the key's name or id if unknown
        secretSuffix = key.name || key.id;
    }
    
    const secretName = `${projectId}::${secretSuffix}`

    return {
      secretName,
      secretValue: key.api_key || undefined,
    };
  }
  

/**
 * Convert a list of SupabaseKeys into SecretItems
 */
function supabaseKeysToGitSecret(keys: SupabaseKeys[]): SecretItem[] {
	return keys.map(supabaseKeyToGitSecret);
}

/**
 * Convert a list of SupabaseKeys into Supabase Vault secrets format
 */
function supabaseKeysToVault(keys: SupabaseKeys[], projectId: string): SecretItem[] {
    return keys.map((key) => supabaseKeyToVaultSecret(key, projectId));
}

/**
 * @description Provisions secrets and env vars for a newly created Supabase project.
 * Runs in the background after the main OAuth callback has already redirected the user.
 * Includes retry logic for getProjectApiKeys since Supabase may not have fully initialized yet.
 */
async function provisionProjectSecrets(args: {
    supabaseM: SupabaseManagementAPI,
    supabase: SupabaseClient<any, any>,
    projectRef: string,
    projectUrl: string,
    projectId: string,
    integrationId: string,
    dokkuAppName: string,
    repoId: number
}) {
    const { supabaseM, supabase, projectRef, projectUrl, projectId, integrationId, dokkuAppName, repoId } = args
    const { setDokkuEnv } = await import("@/server/dokku/dokku-set-env");

    // Retry logic since Supabase project may not be fully initialized yet
    async function getKeysWithRetry(maxAttempts = 5): Promise<SupabaseKeys[]> {
        for (let i = 0; i < maxAttempts; i++) {
            const keys = await supabaseM.getProjectApiKeys(projectRef)
            if (keys?.length) return keys
            console.log(`[provisionProjectSecrets]: API keys not ready yet, retrying (${i + 1}/${maxAttempts})...`)
            await new Promise(r => setTimeout(r, 3000))
        }
        throw new Error('Could not retrieve project API keys after retries')
    }

    const keysRes = await getKeysWithRetry()

    const supabaseKeys = supabaseKeysToVault(keysRes, projectId)
    const vaultSecrets = [...supabaseKeys, { secretName: `${projectId}::${NEXT_PUBLIC_SUPABASE_URL}`, secretValue: projectUrl }]

    await createVaultSecrets(vaultSecrets)
    //logger.info("[provisionProjectSecrets]: Successfully created vault secrets")

    const secretMap = vaultSecrets.reduce<Record<string, string>>((acc, item) => {
        if (!item.secretName || item.secretValue === undefined) return acc
        const parts = item.secretName.split("::")
        const secretKey = parts.length > 1 ? parts[1] : parts[0]
        acc[secretKey] = item.secretValue
        return acc
    }, {})

    // Before setDokkuEnv
    await waitForDokkuReady(projectId);
    await setDokkuEnv(projectId, dokkuAppName, secretMap);
    //logger.info("[provisionProjectSecrets]: Successfully set Dokku env vars")
}