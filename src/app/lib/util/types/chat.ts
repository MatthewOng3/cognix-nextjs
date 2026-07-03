import type { ChatHistory } from "../supabase/types/tables";

export type ChatSession = {
  chat_session_id: string; //PK
  project_id: string; //FK
  user_id: number; //FK
  chat_type: "Builder" | "Planner";
  created_at: Date;
  updated_at: Date;
};

// Pagination types
export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string; // For cursor-based pagination
};

// Paginated response type used in api/chat/[session_id]/messages/route.ts
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    has_more: boolean;
    next_cursor?: string;
    total?: number;
  };
};

// API Response types
export type ChatMessagesResponse = PaginatedResponse<ChatHistory>;

// Database Index Recommendations for Pagination:
// CREATE INDEX idx_chat_messages_session_created
// ON chat_messages(chat_session_id, created_at DESC);
//
// This index will optimize queries that fetch messages
// for a specific session ordered by creation time
