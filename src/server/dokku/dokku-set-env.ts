"use server";
 
import { envConfig } from "@/app/lib/util/env-config";
import { execDokku } from "./dokku-create-project";
 

/**
 * @description Set ENV variables directly on dokku app config. Both preview and production
 * @param appName Name of dokku app
 * @param envVars dict where secret name as key and secret value as value
 */
export async function setDokkuEnv(projectId: string, appName: string, envVars: Record<string, string>) {
    const { NodeSSH } = await import("node-ssh");
    const ssh = new NodeSSH();

    try {
        
        if (!process.env.SSH_DOKKU_KEY) {
            throw new Error("Error retrieving dokku ssh key during dokku app setup");
        }
        const domainSuffix = `${envConfig.subdomain}.${envConfig.domain}`
        
        await ssh.connect({
            host: domainSuffix,
            username: 'dokku',
            privateKey: process.env.SSH_DOKKU_KEY.trim(),
        });

        // Prepare a single config:set command for preview
        const keyValuePairs = Object.entries(envVars)
            .map(([key, value]) => `${key}='${value}'`)
            .join(" ");
        const cmd = `config:set ${appName} ${keyValuePairs}`;
        
        console.log(`🔧 Setting Dokku ENV vars for preview app:`, Object.keys(envVars));
        console.log('Command', cmd)
        
        await execDokku(ssh, appName, cmd);

        //Set dokku env for production app
        const prodAppName = `cognix-${projectId}`
        const prodCmd = `config:set ${prodAppName} ${keyValuePairs}`;
        
        console.log(`🔧 Setting Dokku ENV vars for production:`, Object.keys(envVars));
        console.log('Command', cmd)
        await execDokku(ssh, prodAppName, prodCmd);
        
    } catch (err) {
        console.log("Error setting dokku env", err);
    } finally {
        ssh.dispose();
    }
}

