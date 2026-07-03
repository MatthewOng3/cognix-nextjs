import { WebContainer } from "@webcontainer/api";

// Enhanced singleton pattern for WebContainer management
class WebContainerManager {
  private static instance: WebContainerManager | null = null;
  private webContainer: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  private isBooting: boolean = false;
  private listeners: Set<(container: WebContainer | null) => void> = new Set();
  private eventSource: EventSource | null = null;

  static getInstance(): WebContainerManager {
    if (!WebContainerManager.instance) {
      WebContainerManager.instance = new WebContainerManager();
    }
    return WebContainerManager.instance;
  }

  async getWebContainer(): Promise<WebContainer | null> {
    // Return existing instance if available
    if (this.webContainer) {
      return this.webContainer;
    }

    // Return existing boot promise if already booting
    if (this.bootPromise) {
      return this.bootPromise;
    }

    // Start new boot process
    return this.bootWebContainer();
  }

  private async bootWebContainer(): Promise<WebContainer> {
    if (this.isBooting || this.webContainer) {
      return this.webContainer || this.bootPromise!;
    }

    console.log("BOOTING WEB CONTAINER");
    this.isBooting = true;

    this.bootPromise = WebContainer.boot()
      .then((container) => {
        this.webContainer = container;
        this.isBooting = false;
        //this.notifyListeners(container);
        console.log("WEB CONTAINER BOOTED SUCCESSFULLY");
        return container;
      })
      .catch((err) => {
        this.isBooting = false;
        this.bootPromise = null;
        //this.notifyListeners(null);
        console.error("Failed to boot WebContainer:", err);
        throw err;
      });

    return this.bootPromise;
  }

  // subscribe(callback: (container: WebContainer | null) => void) {
  //     this.listeners.add(callback);
  //     // Immediately notify with current state
  //     callback(this.webContainer);

  //     return () => {
  //         this.listeners.delete(callback);
  //     };
  // }

  // private notifyListeners(container: WebContainer | null) {
  //     this.listeners.forEach(callback => callback(container));
  // }

  getEventSource(): EventSource | null {
    return this.eventSource;
  }

  setEventSource(eventSource: EventSource | null) {
    if (this.eventSource && this.eventSource !== eventSource) {
      this.eventSource.close();
    }
    this.eventSource = eventSource;
  }

  // Method to check if container is healthy
  async isHealthy(): Promise<boolean> {
    if (!this.webContainer) return false;

    try {
      // Simple health check - try to read a directory
      await this.webContainer.fs.readdir("/");
      return true;
    } catch {
      return false;
    }
  }

  // Force restart if container becomes unhealthy
  // async restart(): Promise<WebContainer> {
  //     console.log("Restarting WebContainer...");
  //     this.webContainer = null;
  //     this.bootPromise = null;
  //     this.isBooting = false;

  //     if (this.eventSource) {
  //         this.eventSource.close();
  //         this.eventSource = null;
  //     }

  //     return this.bootWebContainer();
  // }
}

// Global instance
export const webContainerManager = WebContainerManager.getInstance();
