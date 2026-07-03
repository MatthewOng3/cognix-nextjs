/* eslint-disable */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FileSystemTree } from "@webcontainer/api";
import { snapshot } from "@webcontainer/snapshot";
import crypto from "crypto";
import fs from "fs/promises";
import _sodium from "libsodium-wrappers";
import { Octokit } from "octokit";
import os from "os";
import path from "path";
import { createSupabaseAdminClient } from "./util/supabase/server";
import { envConfig } from "./util/env-config";

/**
 * ===========================================================================
 * Enhanced Github API service with WebContainer integration for app previews
 * ===========================================================================
 */

export interface CreateRepoParams {
  name: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}

export interface CreateRepoSecretParams {
  repo: string;
  secretName: string;
  secretValue: string;
}

export interface SecretItem {
  secretName: string;
  secretValue: string | undefined;
}

export interface CreateRepoFromTemplateParams {
  templateRepo: string; //Name of template repo
  projectName: string; //New Project Name
  description?: string; //Optional description
  isPrivate?: boolean;
  autoInit?: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string; //Just the repo name
  full_name: string; //Org + repo name
  html_url: string; //Browser Url for the github repo
  clone_url: string; //Url to clone repo
  ssh_url: string;
  private: boolean;
  description: string | null;
  default_branch: string;
}

export interface RepoSnapshot {
  id: string;
  repoUrl: string;
  commitSha: string;
  projectId: string;
  storagePath: string;
  publicUrl: string;
  createdAt: Date;
  lastAccessed: Date;
  fileCount: number;
  sizeBytes: number;
}

export interface SnapshotMetadata {
  id: string;
  repoUrl: string;
  commitSha: string;
  createdAt: string;
  fileCount: number;
  sizeBytes: number;
}

export interface WebhookPayload {
  repository: {
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  head_commit: {
    id: string;
    message: string;
    timestamp: string;
  };
  ref: string;
}

/**
 * @Description Enhanced Github client with WebContainer snapshot generation, repository interaction
 *
 */
class GitHubService {
  private octokit: Octokit;
  private supabase: SupabaseClient<any, any>;
  private orgName: string;
  private storageBucket: string;
  private snapshots: Map<string, RepoSnapshot> = new Map(); // In-memory cache for metadata
  private readonly SNAPSHOT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    const orgName = process.env.GITHUB_ORG_NAME;
    const supabaseUrl = envConfig.supabaseUrl
    const supabaseServiceKey = envConfig.supabaseServiceKey
    const storageBucket = process.env.APP_SNAPSHOT_STORAGE_BUCKET;

    if (!token) {
      throw new Error("GitHub token not configured");
    }

    if (!orgName) {
      throw new Error("GitHub organization name not configured");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration not found");
    }

    this.octokit = new Octokit({
      auth: token,
    });

    this.supabase = createSupabaseAdminClient();

    this.orgName = orgName;
    this.storageBucket = storageBucket ?? "";

    // Initialize storage bucket if it doesn't exist
    // this.initializeStorage();

    // Clean up old cache entries periodically
    setInterval(() => this.cleanupMemoryCache(), this.SNAPSHOT_CACHE_DURATION);
  }

  // private async initializeStorage() {
  // 	try {
  // 		// Check if bucket exists, create if it doesn't
  // 		const { data: buckets } = await this.supabase.storage.listBuckets();
  // 		const bucketExists = buckets?.some(bucket => bucket.name === this.storageBucket);

  // 		if (!bucketExists) {
  // 			const { error } = await this.supabase.storage.createBucket(this.storageBucket, {
  // 			public: false,
  // 			allowedMimeTypes: ['application/octet-stream'],
  // 			fileSizeLimit: 1024 * 1024 * 100, // 100MB limit
  // 			});

  // 			if (error) {
  // 				console.error('Failed to create storage bucket:', error);
  // 			} else {
  // 				console.log(`Storage bucket '${this.storageBucket}' created successfully`);
  // 			}
  // 	  	}
  // 	} catch (error) {
  // 	  console.error('Error initializing storage:', error);
  // 	}
  // }

  /**
   * @description Function to create a user's project repository in our Github Org, called when user creates a new project.
   * @param params
   * @returns
   */
  async createRepository(params: CreateRepoParams): Promise<GitHubRepo> {
    const { name, isPrivate = true, autoInit = true } = params;

    const { data: repo } = await this.octokit.rest.repos.createInOrg({
      org: this.orgName,
      name,
      private: isPrivate,
      auto_init: autoInit,
    });

    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      private: repo.private,
      description: repo.description,
      default_branch: "main",
    };
  }

   /**
   * @description Create multiple secrets for a repository
   * @param repo Name of repo
   * @param secrets Array of secret objects
   */
	async createRepositorySecrets(repoId: number, secrets: SecretItem[]) {
		try {
			if (!repoId) {
				throw new Error("RepoId must be provided");
			}
			
			
			// Step 1: Get the repo public key  
			const { data: publicKeyData } =  await this.octokit.request(
					"GET /repositories/{repository_id}/actions/secrets/public-key",
					{ repository_id: repoId },
				)
		
			const publicKeyBase64 = publicKeyData.key;
			const keyId = publicKeyData.key_id;
			
			if (!keyId || !publicKeyBase64) {
				throw new Error("Error retrieving public key");
			}
			
			await _sodium.ready;
			const binkey = _sodium.from_base64(
				publicKeyBase64,
				_sodium.base64_variants.ORIGINAL,
			);
			
			for (const { secretName, secretValue } of secrets) {
				if (!secretValue) {
					throw new Error(`Secret value for ${secretName} is missing`);
				}
		
				const secretClean = secretValue.replace(/\\n/g, "\n");
				const binsec = _sodium.from_string(secretClean);
				const encBytes = _sodium.crypto_box_seal(binsec, binkey);
				const encryptedValue = _sodium.to_base64(
					encBytes,
					_sodium.base64_variants.ORIGINAL,
				);	
				
				const response =  await this.octokit.request(
					"PUT /repositories/{repository_id}/actions/secrets/{secret_name}",
					{
						repository_id: repoId,
						secret_name: secretName,
						encrypted_value: encryptedValue,
						key_id: keyId,
						headers: { "X-GitHub-Api-Version": "2022-11-28" },
					}
				)
				
				if (response.status === 201) {
					console.log(
						`✅ Secret "${secretName}" created for repo "${
						repoId
						}"`,
					);
				}
			}
	} catch (err) {
	  console.error("Error creating repository secrets:", err);
	}
  }
  

  /**
   * @description Create secret for repository upon each project creation.
   * @params
   */
  async createRepositorySecret(params: CreateRepoSecretParams) {
    try {
      const { repo, secretName, secretValue } = params;

      // Step 1: Get the repo public key
      const { data: publicKeyData } = await this.octokit.request(
        "GET /repos/{owner}/{repo}/actions/secrets/public-key",
        { owner: this.orgName, repo },
      );

      const publicKeyBase64 = publicKeyData.key;
      const keyId = publicKeyData.key_id;
      console.log("Public key returned", publicKeyBase64, keyId);

      if (!keyId || !publicKeyBase64) {
        throw Error("Error retrieving public key");
      }

      // Step 2: Encrypt the secret
      const secret = secretValue?.replace(/\\n/g, "\n");

      console.log("Secret:", secret);
      if (!secret) {
        throw Error("Error reading Dokku SSH Key");
      }

      //Check if libsodium is ready and then proceed.
      await _sodium.ready;

      // Convert the secret and key to a Uint8Array.
      const binkey = _sodium.from_base64(
        publicKeyBase64,
        _sodium.base64_variants.ORIGINAL,
      );
      const binsec = _sodium.from_string(secret);

      // Encrypt the secret using libsodium
      const encBytes = _sodium.crypto_box_seal(binsec, binkey);

      // Convert the encrypted Uint8Array to Base64
      const encryptedValue = _sodium.to_base64(
        encBytes,
        _sodium.base64_variants.ORIGINAL,
      );

      // Print the output
      console.log("Encrypted Key: ", encryptedValue);

      const response = await this.octokit.request(
        "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
        {
          owner: this.orgName,
          repo: repo,
          secret_name: secretName,
          encrypted_value: encryptedValue,
          key_id: keyId,
          headers: {
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (response.status === 201) {
        console.log(`✅ Secret "${secretName}" created for repo "${repo}"`);
      }

      return response;
    } catch (err) {
      console.log("Error creating repository secret: ", err);
    }
  }

  /**
   * @description Create a repository using another specific repository as template
   * @param params
   * @returns
   */
  async createRepositoryFromTemplate(
    params: CreateRepoFromTemplateParams,
  ): Promise<GitHubRepo> {
    const { data: repo } = await this.octokit.rest.repos.createUsingTemplate({
      template_owner: this.orgName,
      template_repo: params.templateRepo,
      owner: this.orgName,
      name: params.projectName,
      description: params.description,
      include_all_branches: false, // or true, if you want full template history
      private: true,
    });

    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      private: repo.private,
      description: repo.description,
      default_branch: repo.default_branch || "main",
    };
  }

	/**
	 * @description Delete repository from our Org
	 * @param repoName Name of repository
	 */
	async deleteRepository(repoName: string) {
		try {
			await this.octokit.rest.repos.delete({
				owner: this.orgName,
				repo: repoName,
			});
		} catch (error) {
		console.error("Error deleting repository:", error);
		}
	}

	/**
	 * @description Rename a repository in our Org
	 * @param currentName Current repository name
	 * @param newName New repository name
	 */
	async renameRepository(currentName: string, newName: string): Promise<GitHubRepo> {
		try {
			const { data: repo } = await this.octokit.rest.repos.update({
				owner: this.orgName,
				repo: currentName,
				name: newName,
			});

			console.log(`✅ Repository renamed from "${currentName}" to "${newName}"`);
			
			return {
				id: repo.id,
				name: repo.name,
				full_name: repo.full_name,
				html_url: repo.html_url,
				clone_url: repo.clone_url,
				ssh_url: repo.ssh_url,
				private: repo.private,
				description: repo.description,
				default_branch: repo.default_branch || "main",
			};
		} catch (error) {
			console.error("Error renaming repository:", error);
			throw error;
		}
	}

  async getRepository(name: string): Promise<GitHubRepo | null> {
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.orgName,
        repo: name,
      });

      return {
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        private: repo.private,
        description: repo.description,
        default_branch: repo.default_branch || "main",
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * @description
   * @param owner
   * @param repo
   * @param branch
   * @returns
   */
  async getLatestCommitSha(
    owner: string,
    repo: string,
    branch: string = "main",
  ): Promise<string> {
    try {
      const { data: commit } = await this.octokit.rest.repos.getBranch({
        owner,
        repo,
        branch,
      });
      return commit.commit.sha;
    } catch (error) {
      console.error(`Failed to get latest commit for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  parseGitHubUrl(url: string) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub URL format");
    }

    return {
      owner: match[1],
      repo: match[2].replace(".git", ""),
    };
  }

  /**
   * @description Check if file path is relevant to in building preview in web container.
   * @param path
   * @returns
   */
  isRelevantFile(path: string): boolean {
    const skipExtensions = [
      ".git",
      ".DS_Store",
      "node_modules",
      ".next",
      "dist",
      "build",
      ".env",
    ];
    const skipFiles = [
      "package-lock.json",
      "yarn.lock",
      ".gitignore",
      ".env.local",
      ".env.example",
    ];
    const allowedExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".json",
      ".md",
      ".css",
      ".scss",
      ".html",
      ".vue",
      ".py",
      ".php",
    ];

    // Skip if path contains any skip patterns
    if (skipExtensions.some((skip) => path.includes(skip))) return false;
    if (skipFiles.some((skip) => path.endsWith(skip))) return false;
    if (path.startsWith(".") && !path.startsWith("./")) return false;

    // Only include files with allowed extensions or specific config files
    const hasAllowedExtension = allowedExtensions.some((ext) =>
      path.endsWith(ext),
    );
    const isConfigFile = [
      "package.json",
      "tsconfig.json",
      "next.config.js",
      "next.config.mjs",
      "tailwind.config.js",
      "postcss.config.js",
    ].some((config) => path.endsWith(config));

    console.log(
      `Checking if ${path} is relevant, Result if allowed: ${hasAllowedExtension} , Is config file: ${isConfigFile}`,
    );
    return hasAllowedExtension || isConfigFile;
  }

  /**
   * @description Seperate array in chunks, mainly used for seperating files to avoid being rate limited.
   * @param array
   * @param size Chunk Limit
   * @returns
   */
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * @description Fetch the relevant repository files from a specific repository
   * @param repoUrl
   * @param branch
   * @returns Dictionary of files and their content
   */
  async fetchRepoFiles(
    repoUrl: string,
    branch: string = "main",
  ): Promise<Record<string, string>> {
    try {
      const { owner, repo } = this.parseGitHubUrl(repoUrl);
      console.log(`Fetching files from ${owner}/${repo} (${branch})`);

      // Get repository tree
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "true",
      });

      const files: Record<string, string> = {};

      // Filter and fetch only necessary files
      const relevantFiles = tree.tree.filter(
        (item) =>
          item.type === "blob" && item.path && this.isRelevantFile(item.path),
      );

      console.log(`Found ${relevantFiles.length} relevant files`);

      // Process files in chunks to avoid rate limiting by github
      const chunks = this.chunkArray(relevantFiles, 10);

      //For each chunk, get the file contents concurrently
      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (file) => {
            if (!file.path || !file.sha) return;

            try {
              //Result will always be Base64 encoded.
              const { data: blob } = await this.octokit.rest.git.getBlob({
                owner,
                repo,
                file_sha: file.sha,
              });

              // Handle both base64 and utf8 content
              let content: string;
              if (blob.encoding === "base64") {
                content = Buffer.from(blob.content, "base64").toString("utf8");
              } else {
                content = blob.content;
              }

              files[file.path] = content;
            } catch (error) {
              console.warn(
                `Failed to fetch file ${file.path}:`,
                (error as Error).message,
              );
            }
          }),
        );
      }

      console.log(`Files fetch successful: ${files}`);
      return files;
    } catch (error) {
      console.error("Error fetching repository:", error);
      throw new Error(
        `Failed to fetch repository: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @description Convert github file dictionary to format web container api expects
   * @param githubFiles
   * @returns
   */
  convertToWebContainerFormat(
    githubFiles: Record<string, string>,
  ): FileSystemTree {
    const webcontainerFiles: FileSystemTree = {};

    Object.entries(githubFiles).forEach(([path, content]) => {
      const pathParts = path.split("/");
      let current: any = webcontainerFiles;

      console.log(`Converting git files: ${githubFiles}`);

      // Create nested directory structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }

      // Add file content
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        file: {
          contents: content,
        },
      };
    });
    console.log(`Converted web container files: ${webcontainerFiles}`);
    return webcontainerFiles;
  }

  generateSnapshotId(repoUrl: string, commitSha: string): string {
    return crypto
      .createHash("md5")
      .update(`${repoUrl}-${commitSha}`)
      .digest("hex");
  }

  /**
   * @description Generate storage path for each user project using project id/snapshot id
   * @returns
   */
  generateStoragePath(projectId: string, snapshotId: string): string {
    return `${projectId}/${snapshotId}.snapshot`;
  }

  /**
   * @description Upload generated snapshot in binary to supabase storage.
   * @param snapshotBuffer Snapshot file data stored as Binary
   * @param storagePath Storage path to upload the snapshot to
   * @param metadata
   * @returns
   */
  async uploadSnapshotToSupabase(
    snapshotBuffer: Buffer,
    storagePath: string,
    metadata: SnapshotMetadata,
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .upload(storagePath, snapshotBuffer, {
          contentType: "application/octet-stream", //Lets supabase know it is binary data
          metadata: {
            id: metadata.id,
            repoUrl: metadata.repoUrl,
            commitSha: metadata.commitSha,
            createdAt: metadata.createdAt,
            fileCount: metadata.fileCount.toString(),
            sizeBytes: metadata.sizeBytes.toString(),
          },
          upsert: true, // Allow overwriting existing files
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storagePath);

      console.log(`Snapshot uploaded to storage path: ${storagePath}`);
      console.log(`Snapshot uploaded to Supabase: ${publicUrlData.publicUrl}`);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload snapshot to Supabase:", error);
      throw new Error(
        `Failed to upload snapshot to Supabase: ${(error as Error).message}`,
      );
    }
  }

  async checkSnapshotExistsInSupabase(storagePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .list(path.dirname(storagePath), {
          search: path.basename(storagePath),
        });

      if (error) {
        console.log("Error checking snapshot exists in database", error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      return false;
    }
  }

  // async deleteSnapshotFromSupabase(storagePath: string): Promise<void> {
  // 	try {
  // 	  const { error } = await this.supabase.storage
  // 		.from(this.storageBucket)
  // 		.remove([storagePath]);

  // 	  if (error) {
  // 		throw new Error(`Supabase delete error: ${error.message}`);
  // 	  }

  // 	  console.log(`Deleted snapshot from Supabase: ${storagePath}`);
  // 	} catch (error) {
  // 	  console.error('Failed to delete snapshot from Supabase:', error);
  // 	  throw new Error(`Failed to delete snapshot from Supabase: ${(error as Error).message}`);
  // 	}
  // }

  /**
   * @description Based on files grabbed from repository, generate a snapshot using web container snapshot method.
   * Called based on Github webhook listening when developer agent pushes new code.
   * We check if snapshot for latest commit already exists in cache, if not, means it is being triggered to create a new snapshot
   * for latest commit.
   * @param repoUrl
   * @param forceRefresh Flag indicating if user clicked force refresh on frontend
   * @returns Snapshot and metadata related
   */
  async generateSnapshot(
    projectId: string,
    repoUrl: string,
    forceRefresh: boolean = false,
  ): Promise<RepoSnapshot> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    console.log(`Github owner: ${owner} , repo: ${repo}`);
    const repoInfo = await this.getRepository(repo);

    if (!repoInfo) {
      throw new Error(`Repository ${repo} not found`);
    }

    const branch = repoInfo.default_branch;
    //Get latest commit
    const latestCommitSha = await this.getLatestCommitSha(owner, repo, branch);
    console.log(`Latest commit sha: ${latestCommitSha}`);
    //Generate unique snapshot id based on repository and latest commit
    const snapshotId = this.generateSnapshotId(repoUrl, latestCommitSha);
    console.log(`Snapshot Id for latest commit: ${snapshotId}`);
    const storagePath = this.generateStoragePath(projectId, snapshotId); //Get unique storage path
    console.log(`Storage path for snapshot: ${storagePath}`);

    // Check if we have a cached snapshot
    const existingSnapshot = this.snapshots.get(snapshotId);

    //If cached snapshot exists and not forced refreshed by user
    if (existingSnapshot && !forceRefresh) {
      existingSnapshot.lastAccessed = new Date();
      console.log(`Using cached snapshot metadata for ${repoUrl}`);
      console.log(`Existing snapshot found ${existingSnapshot}`);

      // Return snapshot metadata cached
      return existingSnapshot;
      // const existsInSupabase = await this.checkSnapshotExistsInSupabase(storagePath);

      // if (existsInSupabase) {
      // 	return existingSnapshot;
      // } else {
      // 	// Remove from cache if Supabase object doesn't exist
      // 	this.snapshots.delete(snapshotId);
      // 	console.log(`Supabase object missing for cached snapshot, regenerating...`);
      // }
    }

    //If snapshot exists on backend but not on local memory
    if (!forceRefresh) {
      const existsInSupabase =
        await this.checkSnapshotExistsInSupabase(storagePath);
      if (existsInSupabase) {
        console.log(`Found existing snapshot in Supabase for ${repoUrl}`);

        // Create snapshot metadata and cache it
        const { data: publicUrlData } = this.supabase.storage
          .from(this.storageBucket)
          .getPublicUrl(storagePath);

        const snapshotData: RepoSnapshot = {
          id: snapshotId,
          repoUrl,
          projectId,
          commitSha: latestCommitSha,
          storagePath,
          publicUrl: publicUrlData.publicUrl,
          createdAt: new Date(),
          lastAccessed: new Date(),
          fileCount: 0, // We don't have this info from Supabase metadata in this simple check
          sizeBytes: 0,
        };

        this.snapshots.set(snapshotId, snapshotData);
        return snapshotData;
      }
    }

    console.log(`Generating new snapshot for ${repoUrl}`);

    // Create temporary directory for files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "webcontainer-"));
    console.log(`Temp directory generated: ${tempDir}`);

    //Set snapshot data files in memory
    try {
      // Fetch files from GitHub and write to temp directory
      const githubFiles = await this.fetchRepoFiles(repoUrl, branch);
      await this.writeFilesToDisk(githubFiles, tempDir);

      // Enhance package.json for WebContainer compatibility
      //Essentially writes commands to run the app if not present
      await this.enhancePackageJsonOnDisk(tempDir);

      // Generate binary snapshot using StackBlitz's snapshot package
      const snapshotBuffer = await snapshot(tempDir);

      console.log(`Snapshot generated for web container: `, snapshotBuffer);

      // Prepare metadata to be stored in Supabase relating to the file
      const metadata: SnapshotMetadata = {
        id: snapshotId,
        repoUrl,
        commitSha: latestCommitSha,
        createdAt: new Date().toISOString(),
        fileCount: Object.keys(githubFiles).length,
        sizeBytes: snapshotBuffer.length,
      };

      console.log(`Snapshot metadata generated`, metadata);
      // Upload to Supabase snapshot bucket, each user project has their own folder and
      const publicUrl = await this.uploadSnapshotToSupabase(
        snapshotBuffer,
        storagePath,
        metadata,
      );
      console.log(`Public URL for snapshot storage`, publicUrl);

      const snapshotData: RepoSnapshot = {
        id: snapshotId,
        projectId,
        repoUrl,
        commitSha: latestCommitSha,
        storagePath,
        publicUrl,
        createdAt: new Date(),
        lastAccessed: new Date(),
        fileCount: metadata.fileCount,
        sizeBytes: metadata.sizeBytes,
      };

      console.log(`Repo snapshot data:`, snapshotData);

      // Cache the snapshot metadata
      this.snapshots.set(snapshotId, snapshotData);
      console.log(
        `Snapshot ${snapshotId} generated, uploaded to Supabase, and cached URL successfully`,
      );

      // Clean up temp directory
      await this.cleanupTempDir(tempDir);
      console.log(`Temp directory cleaned up`);
      return snapshotData;
    } catch (error) {
      // Clean up temp directory if snapshot generation failed
      await this.cleanupTempDir(tempDir);
      throw error;
    }
  }

  /**
   * @description Write github files into disk memory in order to generate snapshot
   * @param githubFiles
   * @param baseDir
   */
  async writeFilesToDisk(
    githubFiles: Record<string, string>,
    baseDir: string,
  ): Promise<void> {
    for (const [filePath, content] of Object.entries(githubFiles)) {
      const fullPath = path.join(baseDir, filePath);
      const dirPath = path.dirname(fullPath);

      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true });

      // Write file content
      await fs.writeFile(fullPath, content, "utf8");
    }
  }

  /**
   * @description
   * @param baseDir
   */
  async enhancePackageJsonOnDisk(baseDir: string): Promise<void> {
    const packageJsonPath = path.join(baseDir, "package.json");

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageJsonContent);

      // Ensure dev script exists for WebContainer
      if (!packageJson.scripts?.dev && packageJson.scripts?.start) {
        packageJson.scripts.dev = packageJson.scripts.start;
      }

      // Add WebContainer-friendly scripts if missing
      if (!packageJson.scripts?.dev) {
        if (packageJson.dependencies?.next) {
          packageJson.scripts = {
            ...packageJson.scripts,
            dev: "next dev -p 3000",
            build: "next build",
            start: "next start -p 3000",
          };
        } else if (packageJson.dependencies?.react) {
          packageJson.scripts = {
            ...packageJson.scripts,
            dev: "react-scripts start",
            build: "react-scripts build",
          };
        } else if (packageJson.dependencies?.vite) {
          packageJson.scripts = {
            ...packageJson.scripts,
            dev: "vite --port 3000",
            build: "vite build",
          };
        }
      }

      // Write enhanced package.json back to disk
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        "utf8",
      );
    } catch (error) {
      // If package.json doesn't exist or can't be read, that's okay
      console.warn("Could not enhance package.json:", error);
    }
  }

  /**
   * @description Remove and clean up temp directory generated for snapshot generation process.
   * @param tempDir
   */
  async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
    }
  }

  /**
   * @description Get latest existing snapshot for a user repository. Checks local memory, if not present checks supabase storage path.
   * @param repoUrl
   * @returns RepoSnapshot metadata, containin URL to actual binary file data
   */
  async getSnapshot(
    projectId: string,
    repoUrl: string,
  ): Promise<Blob | undefined> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const latestCommitSha = await this.getLatestCommitSha(owner, repo);
    const snapshotId = this.generateSnapshotId(repoUrl, latestCommitSha);

    //Retrieve snapshot metadata from memory
    const snapshot = this.snapshots.get(snapshotId);

    if (snapshot) {
      snapshot.lastAccessed = new Date();
      const snapshotFile = this.downloadSnapshotFromSupabase(
        snapshot.storagePath,
      );
      return snapshotFile;
    }

    // Check if snapshot exists in Supabase
    const storagePath = this.generateStoragePath(projectId, snapshotId);
    const existsInSupabase =
      await this.checkSnapshotExistsInSupabase(storagePath);

    if (existsInSupabase) {
      //Get public url
      //TODO potentially store this as metadata as well
      const { data: publicUrlData } = this.supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(storagePath);

      //Query storage.objects to get stored metadata related to the file
      const { data: metaRow, error: metaError } = await this.supabase
        .schema("storage")
        .from("objects")
        .select("*")
        .eq("bucket_id", this.storageBucket)
        .eq("name", storagePath)
        .single();

      console.log("Bucket Metadata Received", metaRow);

      const snapshotData: RepoSnapshot = {
        id: snapshotId,
        repoUrl,
        projectId,
        commitSha: latestCommitSha,
        storagePath,
        publicUrl: publicUrlData.publicUrl,
        createdAt: metaRow?.user_metadata.createdAt,
        lastAccessed: metaRow?.last_accessed_at,
        fileCount: metaRow?.user_metadata.fileCount,
        sizeBytes: metaRow?.user_metadata.sizeBytes,
      };

      this.snapshots.set(snapshotId, snapshotData);
      const snapshotFile = this.downloadSnapshotFromSupabase(
        snapshotData.storagePath,
      );
      return snapshotFile;
    }

    return undefined;
  }

  /**
   * @description Grab actual Binary file from supabase bucket based on URL
   * @param storagePath Bucket URL stored in memory or metadata
   * @returns Buffer array of actual snapshot file data
   */
  async downloadSnapshotFromSupabase(storagePath: string): Promise<Blob> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.storageBucket)
        .download(storagePath);

      if (error) {
        throw new Error(`Supabase download error: ${error.message}`);
      }

      if (!data) {
        throw new Error("Empty response from Supabase storage");
      }

      // Convert Blob to Buffer
      // const arrayBuffer = await data.arrayBuffer();
      // return Buffer.from(arrayBuffer);
      return data;
    } catch (error) {
      console.error("Failed to download snapshot from Supabase:", error);
      throw new Error(
        `Failed to download snapshot from Supabase: ${(error as Error).message}`,
      );
    }
  }

  // async handleWebhook(payload: WebhookPayload): Promise<void> {
  // 	const { repository, head_commit, ref } = payload;

  // 	// Only process pushes to main/master branch
  // 	if (!ref.endsWith(`/${repository.default_branch}`)) {
  // 	  console.log(`Ignoring push to ${ref}, not default branch`);
  // 	  return;
  // 	}

  // 	console.log(`Processing webhook for ${repository.full_name}, commit: ${head_commit.id}`);

  // 	try {
  // 		// Generate new snapshot for the updated repository
  // 		await this.generateSnapshot(repository.html_url, );
  // 		console.log(`Snapshot updated for ${repository.full_name}`);
  // 	} catch (error) {
  // 		console.error(`Failed to update snapshot for ${repository.full_name}:`, error);
  // 		}
  // 	}

  private cleanupMemoryCache(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, snapshotData] of this.snapshots.entries()) {
      const timeSinceLastAccess =
        now.getTime() - snapshotData.lastAccessed.getTime();

      if (timeSinceLastAccess > this.SNAPSHOT_CACHE_DURATION) {
        this.snapshots.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `Cleaned up ${cleanedCount} cached snapshot metadata entries`,
      );
    }
  }

  //   async deleteSnapshot(repoUrl: string): Promise<void> {
  // 	const { owner, repo } = this.parseGitHubUrl(repoUrl);
  // 	const latestCommitSha = await this.getLatestCommitSha(owner, repo);
  // 	const snapshotId = this.generateSnapshotId(repoUrl, latestCommitSha);
  // 	const storagePath = this.generateStoragePath(snapshotId);

  // 	// Remove from cache
  // 	this.snapshots.delete(snapshotId);

  // 	// Delete from Supabase
  // 	await this.deleteSnapshotFromSupabase(storagePath);
  //   }

  getSnapshotStats(): { total: number; totalCachedMB: number } {
    let totalCachedSize = 0;

    for (const snapshotData of this.snapshots.values()) {
      totalCachedSize += snapshotData.sizeBytes;
    }

    return {
      total: this.snapshots.size,
      totalCachedMB: Math.round((totalCachedSize / 1024 / 1024) * 100) / 100,
    };
  }

  // async listAllSnapshots(): Promise<RepoSnapshot[]> {
  // 	try {
  // 	  const { data, error } = await this.supabase.storage
  // 		.from(this.storageBucket)
  // 		.list(this.STORAGE_PREFIX);

  // 	  if (error) {
  // 		throw new Error(`Failed to list snapshots: ${error.message}`);
  // 	  }

  // 	  return data?.map(file => {
  // 		const snapshotId = file.name.replace('.snapshot', '');
  // 		const { data: publicUrlData } = this.supabase.storage
  // 		  .from(this.storageBucket)
  // 		  .getPublicUrl(`${this.STORAGE_PREFIX}/${file.name}`);

  // 		return {
  // 		  id: snapshotId,
  // 		  repoUrl: '', // Not available from file listing
  // 		  commitSha: '', // Not available from file listing
  // 		  storagePath: `${this.STORAGE_PREFIX}/${file.name}`,
  // 		  publicUrl: publicUrlData.publicUrl,
  // 		  createdAt: new Date(file.created_at || ''),
  // 		  lastAccessed: new Date(),
  // 		  fileCount: 0,
  // 		  sizeBytes: 0,
  // 		};
  // 	  }) || [];
  // 	} catch (error) {
  // 	  console.error('Failed to list snapshots:', error);
  // 	  return [];
  // 	}
  // }
}

// Export a singleton instance
export const githubService = new GitHubService();
