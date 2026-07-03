import { SecretItem } from "@/app/lib/github";
import { createSupabaseAdminClient } from "../server";


export type VaultSecret = {
    name: string;
    value: string;
    description?: string | null;
};

/**
 * @description Create secrets using Supabase Vault function
 * @param secrets 
 * @returns 
 */
export async function createVaultSecrets(secrets: SecretItem[]) {
    //The supabase function is created in public schema
    const supabase = createSupabaseAdminClient()
  
    const results: { name: string; id?: string; error?: string }[] = [];
  
    for (const secret of secrets) {
        const { secretName: name, secretValue: value } = secret;
    
        const { data, error } = await supabase.rpc("create_vault_secret", {
            p_secret_name: name,
            p_secret_value: value
        });
        
        if (error) {
            results.push({ name, error: error.message });
        } else {
            results.push({ name, id: data });
        }
    }
    //logger.info(results,"[src/app/lib/util/supabase/functions/vault-secrets]: Create Vault Secrets Function Results")
    return results;
}