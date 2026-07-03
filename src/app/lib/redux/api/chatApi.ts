import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ChatHistory } from "@/app/lib/util/supabase/types/tables";
import type { ChatMessagesResponse } from "@/app/lib/util/types/chat";
import type { ChatMessageObj } from "../features/chatSlice";

export interface GetMessagesParams {
  sessionId: string;
  projectId: string;
  limit?: number;
  cursor?: string;
}

export interface SendMessageParams {
  sessionId: string;
  projectId: string;
  content: string;
  isPrd?: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessageObj;
  error?: string;
}

// Helper to convert ChatHistory to ChatMessageObj
const toChatMessageObj = (msg: ChatHistory): ChatMessageObj => ({
  chat_session_id: msg.chat_session_id,
  role: msg.role,
  content: msg.content,
  components: msg.components,
  created_at: msg.created_at,
  message_id: msg.message_id,
  is_streaming: false,
  hidden: false,
  is_typewriter: false,
});

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["ChatMessages"],
  endpoints: (builder) => ({
    // Get messages with pagination
    getMessages: builder.query<
      {
        messages: ChatMessageObj[];
        pagination: {
          hasMore: boolean;
          nextCursor?: string;
        };
      },
      GetMessagesParams
    >({
      query: ({ sessionId, projectId, limit = 20, cursor }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          project_id: projectId,
          ...(cursor && { cursor }),
        });

        return `chat/${sessionId}/messages?${params}`;
      },
      transformResponse: (response: ChatMessagesResponse) => ({
        messages: response.data.map(toChatMessageObj),
        pagination: {
          hasMore: response.pagination.has_more,
          nextCursor: response.pagination.next_cursor,
        },
      }),
      providesTags: (result, error, { sessionId }) => [
        { type: "ChatMessages", id: sessionId },
      ],
      // Merge strategy for pagination
      serializeQueryArgs: ({ queryArgs }) => {
        const { sessionId, projectId } = queryArgs;
        return { sessionId, projectId };
      },
      merge: (currentCache, newData, { arg }) => {
        if (arg.cursor) {
          // Loading more messages - append to existing
          return {
            messages: [...currentCache.messages, ...newData.messages],
            pagination: newData.pagination,
          };
        } else {
          // Fresh load - replace all
          return newData;
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        // Force refetch if cursor changes or it's a fresh load
        return currentArg?.cursor !== previousArg?.cursor;
      },
    }),

    // Send message (non-streaming)
    sendMessage: builder.mutation<SendMessageResponse, SendMessageParams>({
      query: ({ sessionId, projectId, content, isPrd = false }) => ({
        url: "chat/send-message",
        method: "POST",
        body: {
          content,
          project_id: projectId,
          session_id: sessionId,
          is_prd: isPrd,
        },
      }),
      // Optimistic update
      async onQueryStarted(
        { sessionId, projectId, content },
        { dispatch, queryFulfilled },
      ) {
        // Create optimistic user message
        const optimisticMessage: ChatMessageObj = {
          chat_session_id: sessionId,
          role: "User",
          content,
          created_at: new Date().toISOString(),
          message_id: `temp-${Date.now()}`,
          is_streaming: false,
          hidden: false,
          is_typewriter: false,
        };

        // Optimistically update the messages cache
        const patchResult = dispatch(
          chatApi.util.updateQueryData(
            "getMessages",
            { sessionId, projectId },
            (draft) => {
              draft.messages.push(optimisticMessage);
              draft.messages.sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );
            },
          ),
        );

        try {
          const { data } = await queryFulfilled;

          // Replace optimistic message with real message if available
          if (data.message) {
            dispatch(
              chatApi.util.updateQueryData(
                "getMessages",
                { sessionId, projectId },
                (draft) => {
                  const tempIndex = draft.messages.findIndex(
                    (m) => m.message_id === optimisticMessage.message_id,
                  );
                  if (tempIndex >= 0 && data.message) {
                    draft.messages[tempIndex] = data.message;
                  }
                },
              ),
            );
          }
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { sessionId }) =>
        error ? [] : [{ type: "ChatMessages", id: sessionId }],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useSendMessageMutation,
} = chatApi;
