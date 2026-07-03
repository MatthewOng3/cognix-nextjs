/* eslint-disable */

// hooks/useWebContainer.js

import { type FileSystemTree, WebContainer } from "@webcontainer/api";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SnapshotSSE } from "../lib/util/types/sse";

// Global reference to prevent multiple instances, to also persist component mounts and unmounts
let globalWebContainer: WebContainer | null = null;
let isBooting = false;

/**
 * @description Web container hook to interact with and Stackblitz web container state
 * @returns
 */
export function useWebContainer() {
  //Track status, not used for much yet
  const [status, setStatus] = useState<
    "ready" | "idle" | "deploying" | "error" | "booting"
  >(globalWebContainer ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);

  //Flag for web container server state
  const [isStartingServer, setIsStartingServer] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string>("");

  // SSE connection ref
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * @description Initiate booting of web container instance
   * @returns Web container instance
   */
  async function bootWebContainer(): Promise<WebContainer | null> {
    if (globalWebContainer || isBooting) {
      console.log("Existing web container found", globalWebContainer);
      return globalWebContainer;
    }

    console.log("BOOTING WEB CONTAINER");

    isBooting = true;
    setStatus("booting");

    try {
      const webcontainerInstance = await WebContainer.boot();

      globalWebContainer = webcontainerInstance;
      console.log("GLOBAL WEB CONTAINER SET", globalWebContainer);

      setStatus("ready");
      isBooting = false;
      return webcontainerInstance;
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
      return null;
    } finally {
      isBooting = false;
    }
  }

  /**
   * @description Prompts the web container to install dependencies first for the user preview
   */
  async function installDependencies() {
    if (!globalWebContainer) return;
    setPreviewStatus("Installing dependencies...");
    try {
      const installProcess = await globalWebContainer.spawn("npm", ["install"]);
      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error("Unable to run npm install");
      }
      console.log("Dependencies installed successfully");
    } catch (err) {
      console.log("Error installing dependencies: ", err);
    }
  }

  /**
   * @description Start the development server
   */
  async function startDevServer() {
    if (!globalWebContainer) return;

    setIsStartingServer(true);

    try {
      const startCommand = ["run", "dev"]; // Default for Next.js/React
      setPreviewStatus("Dependencies installed, starting server...");
      // Check if package.json exists to determine the start command

      // try {
      // 	const packageJson = await webcontainer.fs.readFile('package.json', 'utf-8');
      // 	const pkg = JSON.parse(packageJson);

      // 	// Determine the appropriate start command based on the project
      // 	if (pkg.scripts?.dev) {
      // 		startCommand = ['run', 'dev'];
      // 	} else if (pkg.scripts?.start) {
      // 		startCommand = ['start'];
      // 	} else if (pkg.scripts?.serve) {
      // 		startCommand = ['run', 'serve'];
      // 	}
      // } catch (error) {
      // 	console.log('Could not read package.json, using default command');
      // }

      // Start the development server
      console.log(`Starting server with: npm ${startCommand.join(" ")}`);
      //Output property is a readable stream that can emit strings
      const serverProcess = await globalWebContainer.spawn("npm", startCommand);

      //Listen for server output
      serverProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("Server output:", data);

            //TODO Record server output if issues arise to plug into LLM to fix.

            // Look for common dev server ready messages
            if (
              data.includes("Local:") ||
              data.includes("localhost:") ||
              data.includes("ready") ||
              data.includes("compiled successfully")
            ) {
              // Server is likely ready, get the URL
              //getPreviewUrl();
            }
          },
        }),
      );

      // Also try to get the URL after a short delay
      // setTimeout(() => {
      // 	getPreviewUrl();
      // }, 3000);
    } catch (error) {
      console.error("Failed to start dev server:", error);
    } finally {
      setIsStartingServer(false);
    }
  }

  /**
   * @description Fetch binary buffer file stored in supabase storage or force a new snapshot generation.
   * Mounts file to web container instance before starting dev server.
   */
  const deployProject = useCallback(
    async (
      projectId: string,
      repoUrl: string,
      update: boolean = false,
      files: FileSystemTree = {},
    ) => {
      console.log("Deploy project called");
      if (!globalWebContainer && status !== "booting") {
        //IF causes issues, use global instance
        console.log("No web container found in deploy project, booting");
        await bootWebContainer();
      }

      try {
        setStatus("deploying");
        setError(null);
        setPreviewStatus("Fetching latest code files");
        //Refresh and fetch snapshot data file from backend
        const response = await fetch("/api/project_preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            repoUrl,
            forceRefresh: true,
          }),
        });

        //If response failed
        if (!response.ok) {
          // Handle error responses (which are still JSON)
          const errorResult = await response.json();
          throw new Error(errorResult.error || "Failed to fetch snapshot");
        }

        // Check if response is successful (binary data)
        const success = response.headers.get("X-Success") === "true";
        if (!success) {
          throw new Error("Server indicated failure");
        }

        // Get binary data directly as ArrayBuffer
        const snapshot = await response.arrayBuffer();

        // Validate before proceeding
        if (snapshot.byteLength === 0) {
          throw new Error("Received empty snapshot from server");
        }

        // Convert to Uint8Array for safer handling
        const snapshotData = new Uint8Array(snapshot);
        //TODO look into this more, but due to backend already calling array buffer, if we call it twice
        //snapshotData has nothing ? only snapshot copy below has the data
        //Potentially just return the raw file and not convert to array buffer
        // const snapshotData = snapshot.slice(0);

        if (!snapshotData) {
          setError("Failed to deploy project");
          setStatus("error");
          return;
        }

        if (snapshotData && globalWebContainer) {
          console.log("Snapshot Data Retrieved successfully", snapshotData);
          console.log("Snapshot data type:", typeof snapshotData);

          // Mount the snapshot - WebContainer accepts ArrayBuffer, Uint8Array, or FileSystemTree
          await globalWebContainer.mount(snapshotData);
          console.log("Snapshot mounted successfully", update);

          //Install dependencies on first run
          if (!update) {
            await installDependencies();
          }
          await startDevServer();

          //If first time
          if (!update) {
            // Setup SSE connection AFTER successful initial deployment
            setupSSEConnection(projectId);
          }
        }

        // Return process and webcontainer instance
        setStatus("ready");

        return;
      } catch (err) {
        console.error("Failed to deploy project:", err);
        setError((err as Error).message);
        setStatus("error");
        throw err;
      }
    },
    [globalWebContainer],
  );

  /**
   * @description Fetch and deploy snapshot without user interaction (called by SSE).
   * Similar to deployProject function but taking in snapshot id as argument instead of generating it on backend
   */
  // const deploySnapshotUpdate = async (projectId: string, repoUrl: string) => {
  //     if (!repoUrl || !projectId) {
  //         console.log("No current project to update");
  //         return;
  //     }

  //     if (!globalWebContainer) {
  //         console.log("No web container found for update, booting");
  //         await bootWebContainer();
  //     }

  //     try {
  //         console.log("Deploying snapshot update...");
  //         setStatus('deploying');
  //         setError(null);

  //         // Fetch the updated snapshot
  //         const response = await fetch("/api/project_preview", {
  //             method: "POST",
  //             headers: {
  //                 "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({
  //                 projectId,
  //                 repoUrl,
  //                 forceRefresh: true,
  //                 //snapshotId // Optional: specify which snapshot if provided
  //             }),
  //         });

  //         if (!response.ok) {
  //             const errorResult = await response.json();
  //             throw new Error(errorResult.error || 'Failed to fetch updated snapshot');
  //         }

  //         const success = response.headers.get('X-Success') === 'true';
  //         if (!success) {
  //             throw new Error('Server indicated failure');
  //         }

  //         // Get binary data and convert to Uint8 array
  //         const snapshot = await response.arrayBuffer();
  //         const snapshotData = new Uint8Array(snapshot);

  //         if (snapshotData && globalWebContainer) {
  //             console.log("Updated snapshot retrieved successfully");

  //             // Clear existing files and mount new snapshot
  //             await globalWebContainer.mount(snapshotData);
  //             console.log("Updated snapshot mounted successfully");

  //             // Restart dev server with new code
  //             await startDevServer();

  //             console.log("✅ Project updated with latest code!");
  //         }

  //         setStatus('ready');

  //     } catch (err) {
  //         console.error('Failed to deploy snapshot update:', err);
  //         setError((err as Error).message);
  //         setStatus('error');
  //     }
  // };

  /**
   * @description Setup SSE connection to listen for webhook updates on when to remount snapshot onto web container
   */
  const setupSSEConnection = useCallback(
    (projectId: string) => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      console.log("Setting up SSE connection...");
      const eventSource = new EventSource(
        `/api/project_preview/sse_updates?projectId=${projectId}`,
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection opened");
      };

      //Listen for messages from server regarding deployment process
      eventSource.onmessage = (event) => {
        try {
          const data: SnapshotSSE = JSON.parse(event.data);
          console.log("SSE message received:", data);

          switch (data.type) {
            case "connected":
              console.log("SSE connected successfully");
              break;
            case "new-snapshot-ready":
              console.log("New snapshot available, updating project...");
              deployProject(data.projectId, data.repoUrl, true);
              break;
            // case 'deployment-complete':
            //     console.log("Deployment completed:", data.projectId);
            //     if (data.projectId === currentProjectId) {
            //         deploySnapshotUpdate(data.snapshotId);
            //     }
            //     break;
            default:
              console.log("Unknown SSE message type:", data.type);
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        // Reconnect after a delay
        setTimeout(() => {
          setupSSEConnection(projectId);
        }, 5000);
      };
    },
    [deployProject],
  );

  if (globalWebContainer) {
    globalWebContainer.on("server-ready", (port, url) => {
      setPreviewStatus("Server ready, loading...");
      console.log("Server ready on port:", port);
      console.log("Server URL:", url);
      setPreviewUrl(url);
    });
  }

  // Boot web container on component mount
  // useEffect(() => {
  //     bootWebContainer();

  //     // Cleanup function
  //     return () => {
  //         console.log("Use web container unmounted");
  //         if (eventSourceRef.current) {
  //             eventSourceRef.current.close();
  //         }
  //     };
  // }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    globalWebContainer,
    status,
    error,
    previewUrl,
    previewStatus,
    isStartingServer,
    deployProject,
    // deploySnapshotUpdate, // Expose for manual testing if needed
    isSSEConnected: !!eventSourceRef.current,
  };
}
