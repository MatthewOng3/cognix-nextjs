import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { webContainerManager } from "../lib/managers/webcontainer";

interface DeployOptions {
  projectId: string;
  repoUrl?: string;
  depsHash?: string;
  skipInstall?: boolean;
}

export function useWebContainer() {
  const [status, setStatus] = useState<
    "idle" | "booting" | "ready" | "deploying" | "installing" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string>("");
  const [isStartingServer, setIsStartingServer] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const serverProcessRef = useRef<any>(null);
  const currentProjectRef = useRef<string | null>(null);
  
  // Track dependency hash to avoid unnecessary reinstalls
  const lastDepsHashRef = useRef<Map<string, string>>(new Map());

  /**
   * Boot the WebContainer (singleton, happens once)
   */
  const bootWebContainer = useCallback(async () => {
    try {
      setStatus("booting");
      setPreviewStatus("Booting WebContainer...");
      
      const container = await webContainerManager.getWebContainer();
      
      if (!container) {
        throw new Error("Failed to boot WebContainer");
      }

      // Setup server-ready listener
      container.on("server-ready", (port, url) => {
        console.log(`🚀 Server ready on port ${port}: ${url}`);
        setPreviewUrl(url);
        setPreviewStatus("Server running");
        setStatus("ready");
      });

      setStatus("ready");
      return container;
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
      setPreviewStatus("Boot failed");
      throw err;
    }
  }, []);

  /**
   * Install dependencies with progress tracking
   */
  const installDependencies = useCallback(async (
    container: WebContainer,
    projectId: string
  ) => {
    setStatus("installing");
    setPreviewStatus("Installing dependencies...");
    
    try {
      console.log("📦 Running npm install...");
      const installProcess = await container.spawn("npm", ["install"]);
      
      // Stream output
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("[npm install]:", data);
            
            if (data.includes("packages in")) {
              setPreviewStatus("Dependencies installed");
            } else if (data.includes("added")) {
              setPreviewStatus("Installing packages...");
            }
          },
        })
      );

      const exitCode = await installProcess.exit;
      
      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }
      
      console.log("✅ Dependencies installed");
      setPreviewStatus("Dependencies ready");
    } catch (err) {
      console.error("❌ Failed to install dependencies:", err);
      setPreviewStatus("Installation failed");
      throw err;
    }
  }, []);

  /**
   * Check if dependencies need to be installed
   */
  const needsDependencyInstall = useCallback((
    projectId: string,
    newDepsHash?: string
  ): boolean => {
    if (!newDepsHash) {
      return true;
    }
    
    const lastHash = lastDepsHashRef.current.get(projectId);
    
    if (!lastHash) {
      console.log("🆕 First deployment, will install dependencies");
      return true;
    }
    
    if (lastHash !== newDepsHash) {
      console.log("🔄 Dependencies changed, will reinstall");
      return true;
    }
    
    console.log("⏭️  Dependencies unchanged, skipping install");
    return false;
  }, []);

	/**
	 * Start the dev server
	 */
	const startDevServer = useCallback(async (container: WebContainer) => {
		setIsStartingServer(true);
		setPreviewStatus("Starting dev server...");
	
		try {
		// Kill existing server process if any
		if (serverProcessRef.current) {
			console.log("🔄 Restarting dev server...");
			serverProcessRef.current.kill();
			serverProcessRef.current = null;
		}
	
		await container.spawn("npm", ["run", "build"]);
		const serverProcess = await container.spawn("npm", ["run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]);

	
		serverProcessRef.current = serverProcess;
	
		// Pipe output and detect preview URL
		serverProcess.output.pipeTo(
			new WritableStream({
				write(data) {
					console.log("[dev server]:", data);
		
					// Detect StackBlitz preview URL
					const urlMatch = data.match(/(https?:\/\/[^\s]+\.stackblitz\.io)/);
					if (urlMatch) {
					const url = urlMatch[1];
					console.log("🚀 Preview URL detected:", url);
					setPreviewUrl(url);
					setPreviewStatus("Server running");
					}
		
					// Optionally, update status on successful compilation
					if (data.includes("compiled successfully") || data.includes("ready")) {
					setPreviewStatus("Server running");
					}
				},
			})
		);
	
		console.log("✅ Dev server started, waiting for preview URL...");
	
		} catch (err) {
		console.error("❌ Failed to start dev server:", err);
		setError((err as Error).message);
		setPreviewStatus("Dev server failed");
		throw err;
		} finally {
		setIsStartingServer(false);
		}
	}, []);
  

	/**
	 * Deploy project to WebContainer with smart dependency management
	 */
	const deployProject = useCallback(async (options: DeployOptions) => {
		const { projectId, depsHash, skipInstall = false } = options;
		
		console.log(`🚀 Deploying project: ${projectId}`);
		if (depsHash) {
			console.log(`📋 Dependency hash: ${depsHash}`);
		}
		
		try {
			setStatus("deploying");
			setError(null);
			setPreviewStatus("Loading project...");

			// Get or boot WebContainer
			let container = await webContainerManager.getWebContainer();
			if (!container) {
				container = await bootWebContainer();
			}

			// Fetch snapshot from backend
			setPreviewStatus("Fetching code snapshot...");
			const response = await fetch("/api/project_webcontainer/snapshot", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to fetch snapshot");
			}

			// Get dependency hash from response header
			const serverDepsHash = response.headers.get('X-Deps-Hash');
			const finalDepsHash = depsHash || serverDepsHash || undefined;
			
			// ✅ SIMPLE: Just parse JSON
  			const fileSystemTree = await response.json();
			
			//console.log("FILE SYSTEM TREE", fileSystemTree)
			// Mount snapshot to WebContainer
			setPreviewStatus("Mounting files...");
			// ✅ Mount directly
			await container.mount(fileSystemTree);
			
			console.log("✅ Files mounted");

			// Smart dependency installation
			const isUpdate = currentProjectRef.current === projectId;
			const needsInstall = !skipInstall && 
				(!isUpdate || needsDependencyInstall(projectId, finalDepsHash));

			if (needsInstall) {
				await installDependencies(container, projectId);
				
				if (finalDepsHash) {
					lastDepsHashRef.current.set(projectId, finalDepsHash);
				}
			} else {
				console.log("⏭️  Skipping npm install");
				setPreviewStatus("Using cached dependencies");
			}

			// Start/restart dev server
			await startDevServer(container);

			// Setup SSE for live updates (only on first deploy)
			if (!isUpdate) {
				setupSSEConnection(projectId);
			}

			currentProjectRef.current = projectId;
			setStatus("ready");
			
			console.log("✅ Deployment complete");
		} catch (err) {
			console.error("❌ Deployment failed:", err);
			setError((err as Error).message);
			setStatus("error");
			setPreviewStatus("Deployment failed");
			throw err;
		}
	}, [
		bootWebContainer,
		installDependencies,
		needsDependencyInstall,
		startDevServer
	]);

  /**
   * Setup SSE connection for live code updates
   */
  const setupSSEConnection = useCallback((projectId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log("🔌 Setting up SSE for live updates...");
    
    const eventSource = new EventSource(
      `/api/project_webcontainer/sse?projectId=${projectId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("✅ SSE connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE message:", data);

        switch (data.type) {
			case "connected":
				console.log("SSE handshake complete");
				break;
				
			case "snapshot-ready":
				console.log("🔄 New snapshot available, updating...");
				
				// Hot reload with smart dependency handling
				deployProject({
					projectId: data.projectId,
					depsHash: data.depsHash,
					skipInstall: false, // Let smart logic decide
					});
				break;
				
			default:
				console.log("Unknown SSE message type:", data.type);
		}
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE error:", error);
      eventSource.close();
      
      // Reconnect after delay
      setTimeout(() => {
        if (currentProjectRef.current === projectId) {
          setupSSEConnection(projectId);
        }
      }, 5000);
    };
  }, [deployProject]);

  /**
   * Open preview in new tab
   */
  const openPreviewInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }, [previewUrl]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (serverProcessRef.current) {
        serverProcessRef.current.kill();
        serverProcessRef.current = null;
      }
    };
  }, []);

  return {
    status,
    error,
    previewUrl,
    previewStatus,
    isStartingServer,
    deployProject,
    openPreviewInNewTab,
    isSSEConnected: !!eventSourceRef.current,
  };
}