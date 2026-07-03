/**
 * StreamingService - a singleton that owns the fetch reader lifecycle.
 * Lives outside React so navigation / unmounts don't kill the stream.
 *
 * Usage:
 *   StreamingService.getInstance().start({ ... }, store)
 *   StreamingService.getInstance().stop()
 */

import type { EnhancedStore } from "@reduxjs/toolkit";
import type {
  StreamEvent,
  StreamEventContext,
} from "@/app/lib/util/stream-event-handlers";
import { streamEventRegistry } from "@/app/lib/util/stream-event-handlers";
import {
  addMessage,
  resetStreamingState,
  setStreamingState,
  type ChatMessageObj,
} from "@/app/lib/redux/features/chatSlice";
import type { RootState } from "@/app/lib/redux/store";

interface StartOptions {
  content: string;
  projectId: string;
  sessionId: string;
  isPrd?: boolean;
  threadId?: string | null;
  resumeFromCheckpoint?: boolean;
  skipUserMessage?: boolean;
}

class StreamingService {
  private static instance: StreamingService;

  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private abortController: AbortController | null = null;

  public activeSessionId: string | null = null;

  private listeners: Set<(event: StreamEvent) => void> = new Set();
  private streamingListeners: Set<(sessionId: string | null) => void> =
    new Set();

  private constructor() {}

  static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  onActiveSessionChange(fn: (sessionId: string | null) => void) {
    this.streamingListeners.add(fn);
    return () => this.streamingListeners.delete(fn);
  }

  private broadcastActiveSession(sessionId: string | null) {
    this.streamingListeners.forEach((fn) => fn(sessionId));
  }

  addListener(fn: (event: StreamEvent) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private broadcast(event: StreamEvent) {
    this.listeners.forEach((fn) => fn(event));
  }

  private emitTerminalEvent(
    event: StreamEvent,
    context: StreamEventContext,
  ): void {
    streamEventRegistry.handle(event, context);
    this.broadcast(event);
  }

  isStreaming() {
    return this.reader !== null;
  }

  stop() {
    this.abortController?.abort();
    try {
      this.reader?.cancel();
    } catch {
      // ignore
    }
    this.reader = null;
    this.abortController = null;
    this.activeSessionId = null;
    this.broadcastActiveSession(null);
  }

  async start(options: StartOptions, store: EnhancedStore<RootState>) {
    const {
      content,
      projectId,
      sessionId,
      isPrd = false,
      threadId = null,
      resumeFromCheckpoint = false,
      skipUserMessage = false,
    } = options;

    if (this.reader) {
      this.stop();
    }

    this.activeSessionId = sessionId;
    this.abortController = new AbortController();
    this.broadcastActiveSession(sessionId);

    const getCurrentStreamingState = () => {
      const state = store.getState();
      return (
        state.chat.streamingStates[sessionId] ?? {
          isStreaming: false,
          currentEvent: null,
          currentStatus: "idle" as const,
          currentAiMessage: "",
          isReceivingAiMessage: false,
          streamingMessageId: null,
          toolCalls: [],
          buildStatus: "idle" as const,
          deployStatus: "idle" as const,
          refreshingPreview: false,
          error: null,
        }
      );
    };

    const getCurrentMessages = () =>
      store.getState().chat.sessions[sessionId]?.messages ?? [];

    const context: StreamEventContext = {
      sessionId,
      dispatch: store.dispatch,
      getCurrentStreamingState,
      getCurrentMessages,
    };

    store.dispatch(resetStreamingState(sessionId));
    store.dispatch(
      setStreamingState({ sessionId, streamingState: { isStreaming: true } }),
    );

    if (!skipUserMessage) {
      const userMessage: ChatMessageObj = {
        chat_session_id: sessionId,
        role: "User",
        content,
        created_at: new Date().toISOString(),
        is_typewriter: false,
        is_streaming: false,
        hidden: false,
      };
      store.dispatch(addMessage({ sessionId, message: userMessage }));
    }

    let response: Response;
    try {
      response = await fetch("/api/chat/send-message-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          projectId,
          sessionId,
          isPrd,
          threadId,
          resumeFromCheckpoint,
          skipUserMessage,
        }),
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      store.dispatch(
        setStreamingState({
          sessionId,
          streamingState: {
            error: "Failed to connect to AI server",
            isStreaming: false,
          },
        }),
      );
      this.activeSessionId = null;
      this.broadcastActiveSession(null);
      return;
    }

    if (!response.ok || !response.body) {
      store.dispatch(
        setStreamingState({
          sessionId,
          streamingState: {
            error: `Server error: ${response.statusText}`,
            isStreaming: false,
          },
        }),
      );
      this.activeSessionId = null;
      this.broadcastActiveSession(null);
      return;
    }

    this.reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await this.reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line.length <= 6) {
            continue;
          }

          const jsonString = line.slice(6).trim();
          if (!jsonString) {
            continue;
          }

          let eventData: StreamEvent;
          try {
            eventData = JSON.parse(jsonString);
          } catch {
            continue;
          }

          streamEventRegistry.handle(eventData, context);
          this.broadcast(eventData);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;

      const errMsg = (err as Error)?.message ?? "";
      const isNavigationCancel =
        errMsg.includes("fetch failed") || errMsg.includes("Failed to fetch");

      if (!isNavigationCancel) {
        console.error("[StreamingService] read error", err);
        this.emitTerminalEvent(
          {
            type: "error",
            data: {
              message: err instanceof Error ? err.message : "Stream read error",
            },
            timestamp: new Date().toISOString(),
          },
          context,
        );
      }
    } finally {
      const currentStreamingState = getCurrentStreamingState();
      if (
        currentStreamingState.isStreaming ||
        currentStreamingState.streamingMessageId
      ) {
        this.emitTerminalEvent(
          {
            type: "stream_end",
            data: { reason: "reader_eof" },
            timestamp: new Date().toISOString(),
          },
          context,
        );
      }

      this.reader = null;
      this.abortController = null;
      this.activeSessionId = null;
      this.broadcastActiveSession(null);
    }
  }
}

export const streamingService = StreamingService.getInstance();
