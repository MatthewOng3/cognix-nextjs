// app/api/webcontainer/sse/route.ts
import { NextRequest } from "next/server";

// Store active SSE connections per project
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * @description Frontend will request this route to set up an SSE connection for project preview purposes
 * @param request 
 * @returns 
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  
  if (!projectId) {
    return new Response("Missing projectId", { status: 400 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add connection to set
      if (!connections.has(projectId)) {
        connections.set(projectId, new Set());
      }
      connections.get(projectId)!.add(controller);

      // Send initial connection message
      const data = JSON.stringify({ 
        type: "connected", 
        projectId,
        timestamp: new Date().toISOString()
      });
      controller.enqueue(`data: ${data}\n\n`);

      console.log(`✅ SSE client connected for project: ${projectId}`);
    },
    cancel() {
      // Remove connection when client disconnects
      const projectConnections = connections.get(projectId);
      if (projectConnections) {
        projectConnections.forEach((ctrl) => {
          try {
            ctrl.close();
          } catch (e) {
            // Already closed
          }
        });
        connections.delete(projectId);
      }
      console.log(`❌ SSE client disconnected from project: ${projectId}`);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
