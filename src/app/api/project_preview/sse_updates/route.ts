export const runtime = "nodejs";

import { sseManager } from "@/app/lib/api/server_side_events";

/**
 * @description Receive request sent by client to establish an SSE connection.
 * @param request
 * @route api/project_preview/sse_updates?projectId
 * @returns Data payload to client connection to SSE
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  return new Response(
    new ReadableStream({
      start(controller) {
        sseManager.addConnection(projectId, controller);
        console.log("SSE Added connection");
        // Send initial connection confirmation (text only)
        controller.enqueue(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
        );
      },
      cancel(controller) {
        console.log("Connection dropped", controller);
        sseManager.removeConnection(projectId, controller);
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream", // Special SSE header
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
    // ... headers
  );
}
