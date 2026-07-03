/* eslint-disable */

type Controller = ReadableStreamDefaultController;

export class SSEManager {
  private static instance: SSEManager;
  private connections = new Map<string, Set<Controller>>();

  private constructor() {}

  static getInstance() {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /**
   * @description Add a new connection object to its project id key. Handles multiple connections.
   * @param projectId
   * @param controller
   */
  addConnection(projectId: string | null, controller: Controller) {
    if (!projectId) {
      console.log("Error adding connection no project id");
      return;
    }

    if (!this.connections.has(projectId)) {
      this.connections.set(projectId, new Set());
    }

    this.connections.get(projectId)!.add(controller);
    console.log("AFTER ADD", this.connections);
  }

  /**
   * @description Remove a connection associated with a project
   * @param projectId
   * @param controller
   * @returns
   */
  removeConnection(projectId: string | null, controller: Controller) {
    if (!projectId) {
      console.log("Error removing connection no project id");
      return;
    }
    const controllers = this.connections.get(projectId);
    if (controllers) {
      controllers.delete(controller);
      if (controllers.size === 0) {
        this.connections.delete(projectId);
      }
    }
  }

  /**
   * @description Broadcast data to all SSE connections related to a specific project id
   * @param projectId
   * @param message Data to be broadcasted to all SSE connections
   */
  broadcastToProject(projectId: string, message: any) {
    console.log(this.connections, "ConnectionsSDAASSDASDA");
    const controllers = this.connections.get(projectId);
    if (!controllers || controllers.size === 0) return;

    controllers.forEach((controller) => {
      try {
        controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      } catch (err) {
        console.log(`Error broadcasting to connection: ${err}`);
        controller.close();
        controllers.delete(controller);
      }
    });
  }
}

// Ensure a shared singleton across the current Node process
declare global {
  var sseManager: SSEManager | undefined;
}

export const sseManager = globalThis.sseManager ?? SSEManager.getInstance();
if (!globalThis.sseManager) {
  globalThis.sseManager = sseManager;
}

console.log("SSEManager instance:", sseManager);
console.log("Global reference:", globalThis.sseManager);
