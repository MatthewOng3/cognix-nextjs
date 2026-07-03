import { NodeSSH } from "node-ssh";
import { envConfig } from "@/app/lib/util/env-config";

const DOKKU_HOST = `${envConfig.subdomain}.${envConfig.domain}`;

async function connectDokkuSsh() {
  if (!process.env.SSH_DOKKU_KEY) {
    throw new Error("Missing SSH_DOKKU_KEY for Dokku preview runtime control");
  }

  const ssh = new NodeSSH();
  await ssh.connect({
    host: DOKKU_HOST,
    username: "dokku",
    privateKey: process.env.SSH_DOKKU_KEY.trim(),
  });

  return ssh;
}

async function execDokkuCommand(
  ssh: NodeSSH,
  command: string,
  ignorePatterns: string[] = [],
) {
  const result = await ssh.execCommand(command);
  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();

  if (result.code !== 0) {
    const isIgnored = ignorePatterns.some((pattern) =>
      combinedOutput.toLowerCase().includes(pattern.toLowerCase()),
    );

    if (!isIgnored) {
      throw new Error(
        `Dokku command failed: ${command}\n${combinedOutput || "Unknown Dokku error"}`,
      );
    }
  }

  return combinedOutput;
}

export async function startDokkuPreviewApp(appName: string) {
  const ssh = await connectDokkuSsh();

  try {
    console.log(`[preview-runtime] starting dokku app`, {
      appName,
      host: DOKKU_HOST,
      timestamp: new Date().toISOString(),
    });

    const output = await execDokkuCommand(ssh, `ps:start ${appName}`, [
      "already running",
      "already started",
      "app.json",
      "no web listeners specified",
    ]);

    console.log(`[preview-runtime] started dokku app`, {
      appName,
      timestamp: new Date().toISOString(),
    });

    return output;
  } finally {
    ssh.dispose();
  }
}

export async function stopDokkuPreviewApp(appName: string) {
  const ssh = await connectDokkuSsh();

  try {
    console.log(`[preview-runtime] stopping dokku app`, {
      appName,
      host: DOKKU_HOST,
      timestamp: new Date().toISOString(),
    });

    const output = await execDokkuCommand(ssh, `ps:stop ${appName}`, [
      "already stopped",
      "not running",
      "has no procfile entry",
    ]);

    console.log(`[preview-runtime] stopped dokku app`, {
      appName,
      timestamp: new Date().toISOString(),
    });

    return output;
  } finally {
    ssh.dispose();
  }
}
