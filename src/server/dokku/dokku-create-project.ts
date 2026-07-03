import { envConfig } from "@/app/lib/util/env-config";
import { createSupabaseAdminClient } from "@/app/lib/util/supabase/server";

export async function execDokku(ssh: any, appName: string, command: string, ignorePatterns: string[] = []) {
    const res = await ssh.execCommand(command);
    if (res.code !== 0) {
        throw new Error(`Dokku command failed: ${command}\n${res.stderr}`);
    }
    // if (res.stderr) {
    //     const isIgnored = ignorePatterns.some(pat => res.stderr.includes(pat));
    //     if (!isIgnored) {
    //         throw new Error(`Dokku command failed: ${command}\n${res.stderr}`);
    //     } else {
    //         console.log(`Warning (ignored): ${command}\n${res.stderr}`);
    //     }
    // }
    return res.stdout;
}

export async function dokkuAppSetup(appName: string, projectId: string){
    const { NodeSSH } = await import("node-ssh"); 
    const supabase = createSupabaseAdminClient();
    const ssh = new NodeSSH();
    const rootSSH = new NodeSSH();
    const baseImage = `cognix/nextjs-base:latest`
    try {
        if(!process.env.SSH_DOKKU_KEY) {
            throw new Error("Error retrieving dokku ssh key during dokku app setup")
        }
        const domainSuffix = `${envConfig.subdomain}.${envConfig.domain}`

        await ssh.connect({
            host: domainSuffix,
            username: 'dokku',
            privateKey: process.env.SSH_DOKKU_KEY.trim(),
        });

        await rootSSH.connect({
            host: domainSuffix,
            username: "deploy",
            privateKey: envConfig.dokkuDeployKey.trim(),
        });

        console.log(`🚀 Setting up Dokku app: ${appName}`);

        // 1. Create app
        console.log("📦 Creating Dokku app...");
        await execDokku(ssh, appName, `apps:create ${appName}`, ["already exists"]);
        
        // 2️⃣ Create persistent storage directory
        console.log("💾 Creating persistent storage...");
        await execDokku(ssh, appName, `storage:ensure-directory ${appName}-code`);

        // 3️⃣ Copy ALL files from base image to storage (includes code + node_modules)
        // We use dest because container can't write to storage path
        console.log("📋 Copying template files to storage...");
        const storagePath = `/var/lib/dokku/data/storage/${appName}-code`;
        await rootSSH.execCommand(
            `docker run --rm -v ${storagePath}:/dest ${baseImage} sh -c "cp -r /app/* /dest/"`
        ); 

        // 4. Mount storage into /app
        console.log("🔗 Mounting storage...");
        await execDokku(ssh, appName, `storage:mount ${appName} ${storagePath}:/app`);

        // 5️⃣. Add subdomain
        console.log("🌐 Adding domain...");
        await execDokku(ssh, appName, `domains:add ${appName} ${appName}.${domainSuffix}`, [
            "already exists",
            "Please run dokku letsencrypt:enable",
            "No web listeners specified" // ignore warning if app empty
        ]);
        
        // 6. Set env config before deploy so git:from-image picks it up
        console.log("Setting .env config");
        await execDokku(ssh, appName, `config:set --no-restart ${appName} NODE_ENV='development'`);

        // 7️⃣ Deploy user app from base image
        console.log("🐳 Deploying container...");
        await execDokku(ssh, appName, `git:from-image ${appName} ${baseImage}`, [
            "No changes detected",
            "No healthchecks found",
            "No web listeners specified",
            "already exists",
            "No healthchecks found in app.json for web process type"
        ]);
        
        // 8. Set port mapping after deploy
        console.log("🔌 Setting port mapping...");
        await execDokku(ssh, appName, `ports:set ${appName} http:80:3000`, ["already exists", "No web listeners specified"]);
        
        // 9. Setup SSL
        console.log("🔐 Setting up SSL...");
        await execDokku(ssh, appName, `letsencrypt:set ${appName} email ${process.env.COGNIX_EMAIL}`, ["already set", "No web listeners specified"]);
        await execDokku(ssh, appName, `letsencrypt:enable ${appName}`, ["No web listeners specified"]);

        console.log(`✅ Dokku setup completed for ${appName}`);
        await supabase.from('project')
        .update({ dokku_status: 'ready' })
        .eq('dokku_app_name', appName);

        // ── Production app setup (no deploy, just config) ─────────────────────
        const prodAppName = `${appName.replace("preview-cognix-", "cognix-")}`;
        
        const prodDomain = `${prodAppName}.${domainSuffix}`;

        console.log(`🚀 Setting up production Dokku app: ${prodAppName}`);

        // 1. Create prod app
        await execDokku(ssh, prodAppName, `apps:create ${prodAppName}`, ["already exists"]);

        // 2. Add domain
        await execDokku(ssh, prodAppName, `domains:add ${prodAppName} ${prodDomain}`, [
            "already exists",
            "Please run dokku letsencrypt:enable",
            "No web listeners specified",
        ]);

        // 3. Set base env config
        await execDokku(ssh, prodAppName, `config:set --no-restart ${prodAppName} NODE_ENV='production'`);

        // 4. Store prod app name + url in DB so frontend knows the prod URL
        await supabase.from("user_production_deployment").insert({
            project_id: projectId,
            prod_dokku_status: "created",
            prod_app_name: prodAppName,
            prod_url: `https://${prodDomain}`,
        });
        
        console.log(`✅ Production app shell created: ${prodAppName}`);

    } catch(err) {
        // Add this temporarily after the failed deployment to debug
        const logsResult = await ssh.execCommand(`dokku logs ${appName} --num 100`);
        console.log("📋 Container logs:", logsResult.stdout);
        console.error(err);
        throw err;
    } finally {
        ssh.dispose();
        rootSSH.dispose();
    }
}

