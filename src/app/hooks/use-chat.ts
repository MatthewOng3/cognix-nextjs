/* eslint-disable */
/**
 * useChat — thin React wrapper around StreamingService + Redux.
 *
 * Key change: sendStreamingMessage now delegates to StreamingService (singleton),
 * so navigation away from the builder tab does NOT kill the stream.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
} from "@/app/lib/redux/api/chatApi";
import {
  addMessage,
  type ChatMessageObj,
  initializeSession,
  resetStreamingState,
  type StreamingState,
  setError,
  setMessages,
  setPagination,
  setProductChatLoading,
  setStreamingState,
} from "@/app/lib/redux/features/chatSlice";
import type { RootState } from "@/app/lib/redux/store";
import type { PlannerResponse } from "../api/chat/generate-plan/route";
import { useAlert } from "../components/AlertNotif";
import { setProductDocMarkdown } from "../lib/redux/features/projectSlice";
import { streamingService } from "../lib/services/streamingService"; // ← new singleton
import {
  type StreamEvent,
  type StreamEventContext,
  streamEventRegistry,
} from "../lib/util/stream-event-handlers";
import type { ApiResponse } from "../lib/util/types/api";
import type { DeploymentUpdatePayload } from "./use-supabase-channel";
import { useUser } from "./use-user";

interface UseChatOptions {
  projectId: string;
  sessionId: string;
  limit?: number;
  autoLoad?: boolean;
}

interface UseChatReturn {
  messages: ChatMessageObj[];
  loading: boolean;
  loadingMore: boolean;
  isProductChatLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => void;
  streamingState: StreamingState;
  sendStreamingMessage: (
    content: string,
    isPrd?: boolean,
    threadId?: string | null,
    resumeFromCheckpoint?: boolean,
    skipMessage?: boolean,
  ) => Promise<void>;
  sendPlannerMessage: (
    content: string,
    productDoc: string | null,
  ) => Promise<void>;
  sendManualMessage: (msg: ChatMessageObj) => void;
  stopStreaming: () => void;
  resetStreaming: () => void;
  handleDeploymentUpdate: (payload: DeploymentUpdatePayload) => void;
}

export function useChat({
  projectId,
  sessionId,
  limit = 20,
  autoLoad = true,
}: UseChatOptions): UseChatReturn {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const { showAlert } = useAlert();
  const { fetchUserInfo } = useUser();
  const [loadMoreMessages] = useLazyGetMessagesQuery();
  const previousIsStreamingRef = useRef(false);

  // Initialize session in Redux
  useEffect(() => {
    dispatch(initializeSession(sessionId));
  }, [dispatch, sessionId]);

  // ─── Selectors ────────────────────────────────────────────────────────────

  const rawSessionState = useSelector(
    (state: RootState) => state.chat.sessions[sessionId],
  );

  const isProductChatLoading = useSelector(
    (state: RootState) => state.chat.isProductChatLoading,
  );

  const sessionState = useMemo(
    () =>
      rawSessionState || {
        messages: [],
        pagination: { hasMore: true, loading: false, loadingMore: false },
        error: null,
      },
    [rawSessionState],
  );

  //Retrieve the stored streaming state
  const rawStreamingState = useSelector(
    (state: RootState) => state.chat.streamingStates[sessionId],
  );

  const streamingState = useMemo(
    () =>
      rawStreamingState || {
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
      },
    [rawStreamingState],
  );

  // ==== RTK Query to fetch chat data ====
  const isCurrentlyStreaming = streamingService.activeSessionId === sessionId;
  const {
    data: messagesData,
    isLoading,
    error: queryError,
    refetch,
  } = useGetMessagesQuery(
    { sessionId, projectId, limit },
    {
      skip: !autoLoad || !sessionId || !projectId || isCurrentlyStreaming,
      refetchOnMountOrArgChange: true,
    },
  );
  // ==== RTK Query to fetch chat data ====
  useEffect(() => {
    if (!messagesData || messagesData.messages.length === 0) return;

    // If a stream is actively writing to this session, don't let a DB refetch
    // clobber the in-progress streaming message.  The streaming message will
    // be saved to DB once stream_end fires, so the next natural refetch will
    // pick it up correctly.
    const currentStreamingState =
      store.getState().chat.streamingStates[sessionId];
    if (currentStreamingState?.isStreaming) return;

    dispatch(
      setMessages({
        sessionId,
        messages: messagesData.messages,
        replace: !sessionState.pagination.nextCursor,
      }),
    );

    dispatch(
      setPagination({
        sessionId,
        pagination: {
          hasMore: messagesData.pagination.hasMore,
          nextCursor: messagesData.pagination.nextCursor,
          loading: false,
        },
      }),
    );
  }, [
    messagesData,
    dispatch,
    sessionId,
    sessionState.pagination.nextCursor,
    store,
  ]);

  useEffect(() => {
    dispatch(setPagination({ sessionId, pagination: { loading: isLoading } }));
  }, [isLoading, dispatch, sessionId]);

  useEffect(() => {
    if (queryError) {
      const errorMessage =
        "data" in queryError && queryError.data
          ? String(queryError.data)
          : "status" in queryError
            ? `Error: ${queryError.status}`
            : "An error occurred";
      dispatch(setError({ sessionId, error: errorMessage }));
    }
  }, [queryError, dispatch, sessionId]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const wasStreaming = previousIsStreamingRef.current;
    const isStreamingNow = streamingState.isStreaming;

    if (wasStreaming && !isStreamingNow) {
      void fetchUserInfo();
    }

    previousIsStreamingRef.current = isStreamingNow;
  }, [fetchUserInfo, streamingState.isStreaming]);

  const handleDeploymentUpdate = useCallback(
    (payload: DeploymentUpdatePayload) => {
      if (payload.finished_at) {
        dispatch(
          setStreamingState({
            sessionId,
            streamingState: { refreshingPreview: false },
          }),
        );
      }
    },
    [dispatch, sessionId],
  );

  const loadMore = useCallback(async () => {
    if (sessionState.pagination.loadingMore || !sessionState.pagination.hasMore)
      return;

    dispatch(setPagination({ sessionId, pagination: { loadingMore: true } }));

    try {
      const result = await loadMoreMessages({
        sessionId,
        projectId,
        limit,
        cursor: sessionState.pagination.nextCursor,
      });
      if ("error" in result) throw new Error("Failed to load more messages");
    } catch (error) {
      dispatch(
        setError({
          sessionId,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load more messages",
        }),
      );
    } finally {
      dispatch(
        setPagination({ sessionId, pagination: { loadingMore: false } }),
      );
    }
  }, [
    sessionState.pagination.loadingMore,
    sessionState.pagination.hasMore,
    sessionState.pagination.nextCursor,
    loadMoreMessages,
    sessionId,
    projectId,
    limit,
    dispatch,
  ]);

  const refresh = useCallback(() => {
    dispatch(
      setPagination({
        sessionId,
        pagination: { hasMore: true, nextCursor: undefined },
      }),
    );
    refetch();
  }, [refetch, dispatch, sessionId]);

  const emitTerminalEvent = useCallback(
    (event: StreamEvent) => {
      const context: StreamEventContext = {
        sessionId,
        dispatch,
        getCurrentStreamingState: () => {
          const state = store.getState();
          return (
            state.chat.streamingStates[sessionId] || {
              isStreaming: false,
              currentEvent: null,
              currentStatus: "idle" as const,
              currentAiMessage: "",
              isReceivingAiMessage: false,
              streamingMessageId: null,
              toolCalls: [],
              taskList: [],
              buildStatus: "idle" as const,
              deployStatus: "idle" as const,
              refreshingPreview: false,
              error: null,
            }
          );
        },
        getCurrentMessages: () => {
          const state = store.getState();
          return state.chat.sessions[sessionId]?.messages || [];
        },
      };

      streamEventRegistry.handle(event, context);
    },
    [dispatch, sessionId, store],
  );

  const finalizeStreamingUi = useCallback(
    (reason: string) => {
      const currentStreamingState =
        store.getState().chat.streamingStates[sessionId];
      if (!currentStreamingState) {
        return;
      }

      if (
        currentStreamingState.isStreaming ||
        currentStreamingState.streamingMessageId
      ) {
        emitTerminalEvent({
          type: "stream_end",
          data: { reason },
          timestamp: new Date().toISOString(),
        });
      }
    },
    [emitTerminalEvent, sessionId, store],
  );

  /**
   * Delegates to StreamingService — survives component unmount / tab switches.
   */
  const sendStreamingMessage = useCallback(
    async (
      content: string,
      isPrd: boolean = false,
      threadId: string | null = null,
      resumeFromCheckpoint: boolean = false,
      skipMessage: boolean = false,
    ): Promise<void> => {
      if (!projectId || !sessionId) {
        showAlert("No project id being sent", "error");
        return;
      }

      try {
        // StreamingService owns the fetch + Redux dispatch from here on
        await streamingService.start(
          {
            content,
            projectId,
            sessionId,
            isPrd,
            threadId,
            resumeFromCheckpoint,
            skipUserMessage: skipMessage,
          },
          store,
        );
      } catch (error) {
        emitTerminalEvent({
          type: "error",
          data: {
            message:
              error instanceof Error
                ? error.message
                : "Failed to process streaming response",
          },
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    },
    [emitTerminalEvent, projectId, sessionId, showAlert, store],
  );

  const sendPlannerMessage = useCallback(
    async (
      content: string,
      productDoc: string | null = null,
    ): Promise<void> => {
      try {
        const userMessage: ChatMessageObj = {
          message_id: crypto.randomUUID(),
          chat_session_id: sessionId,
          role: "User",
          content,
          created_at: new Date().toISOString(),
          is_streaming: false,
          is_typewriter: false,
        };

        dispatch(addMessage({ sessionId, message: userMessage }));
        dispatch(setProductChatLoading(true));

        const response = await fetch("/api/chat/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            project_id: projectId,
            chat_session_id: sessionId,
            product_doc: productDoc,
          }),
        });

        const generatePlanResponse: ApiResponse<PlannerResponse> =
          await response.json();
        const aiResponse = generatePlanResponse.data;

        if (!response.ok) {
          dispatch(setProductChatLoading(false));
          throw new Error(
            generatePlanResponse.error || `Request failed: ${response.status}`,
          );
        }

        if (aiResponse) {
          const plannerAiMessage: ChatMessageObj = {
            is_typewriter: true,
            chat_session_id: sessionId,
            content: aiResponse.content,
            role: "AI",
            message_id: aiResponse.message_id,
            created_at: aiResponse.created_at,
          };
          dispatch(addMessage({ sessionId, message: plannerAiMessage }));
          dispatch(setProductChatLoading(false));
        }

        if (aiResponse?.product_markdown_doc) {
          dispatch(setProductDocMarkdown(aiResponse.product_markdown_doc));
        }
      } catch (err) {
        dispatch(setProductChatLoading(false));
        console.error("Error sending planner message", err);
      }
    },
    [sessionId, projectId, dispatch],
  );

  /** Hard-stop the stream (e.g. user clicks Stop button) */
  const stopStreaming = useCallback(() => {
    streamingService.stop();
    finalizeStreamingUi("manual_stop");
    dispatch(resetStreamingState(sessionId));
  }, [dispatch, finalizeStreamingUi, sessionId]);

  const resetStreaming = useCallback(() => {
    finalizeStreamingUi("manual_reset");
    dispatch(resetStreamingState(sessionId));
  }, [dispatch, finalizeStreamingUi, sessionId]);

  const sendManualMessage = useCallback(
    async (msg: ChatMessageObj) => {
      try {
        dispatch(addMessage({ sessionId, message: msg }));
        await fetch("/api/chat/insert_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg.content,
            chatSessionId: sessionId,
            role: msg.role,
          }),
        });
      } catch (err) {
        console.error("Error sending manual message", err);
      }
    },
    [sessionId, dispatch],
  );

  return {
    messages: sessionState.messages,
    loading: isLoading || sessionState.pagination.loading,
    isProductChatLoading,
    loadingMore: sessionState.pagination.loadingMore,
    hasMore: sessionState.pagination.hasMore,
    error:
      sessionState.error || (queryError ? "Failed to load messages" : null),
    loadMore,
    refresh,
    streamingState,
    sendStreamingMessage,
    stopStreaming,
    resetStreaming,
    sendPlannerMessage,
    handleDeploymentUpdate,
    sendManualMessage,
  };
}
