import { envConfig } from "@/app/lib/util/env-config";
import { execDokku } from "./dokku-create-project";

/**
 * @description Rename a Dokku app and update its domain
 * @param oldRepoName Old repository name
 * @param newRepoName New repository name
 */
export async function dokkuAppRename(oldRepoName: string, newRepoName: string) {
    const { NodeSSH } = await import("node-ssh");
    const ssh = new NodeSSH();
    try {
        if (!process.env.SSH_DOKKU_KEY) {
            throw new Error("Error retrieving dokku ssh key during dokku app rename");
        }
        const domainSuffix = `${envConfig.subdomain}.${envConfig.domain}`;

        await ssh.connect({
            host: domainSuffix,
            username: 'dokku',
            privateKey: process.env.SSH_DOKKU_KEY.trim(),
        });

        const oldAppName = `preview-${oldRepoName}`;
        const newAppName = `preview-${newRepoName}`;

        // 1. Rename the app
        await execDokku(ssh, oldAppName, `apps:rename ${oldAppName} ${newAppName}`, []);

        // 2. Remove old domain
        await execDokku(ssh, newAppName, `domains:remove ${newAppName} ${oldAppName}.${domainSuffix}`, [
            "does not exist",
            "No web listeners specified"
        ]);

        // 3. Add new domain
        await execDokku(ssh, newAppName, `domains:add ${newAppName} ${newAppName}.${domainSuffix}`, [
            "already exists",
            "No web listeners specified"
        ]);

        console.log(`✅ Dokku app renamed from ${oldAppName} to ${newAppName}`);
    } catch (err) {
        console.error("Error renaming Dokku app:", err);
        throw err;
    } finally {
        ssh.dispose();
    }
}