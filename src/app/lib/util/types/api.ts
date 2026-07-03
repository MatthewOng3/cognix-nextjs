import type { Block } from "@blocknote/core";
import type {
  ChatSession,
  Project,
} from "@/app/lib/util/supabase/types/tables";

// Standard API response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T; //T is the type of the data returned by the API and used as an argument
  error?: string;
};

// Project creation response type
export type CreateProjectResponse = {
  project: Project;
  chatSession: ChatSession;
  plannerSession: ChatSession;
};

// Projects fetch response type
export type FetchProjectsResponse = Project[];

// Project with chat session IDs
export type ProjectWithChatSessions = Project & {
  builderSessionId: string | null;
  plannerSessionId: string | null;
  isLoading: boolean;
};

// Projects with chat sessions response type
export type FetchProjectsWithChatSessionsResponse = ProjectWithChatSessions[];

//Fetch Product Docs
export type FetchProductDocResponse = {
  product_doc_id: string;
  project_id: string;
  document_json: Block[];
  created_at: string;
  updated_at: string;
  document_markdown: string;
};

// // Error response type
// export type ErrorResponse = {
//   success: false;
//   error: string;
//   project?: Project; // For partial success cases
//   chatError?: string;
// };

// // Success response type
// export type SuccessResponse<T> = {
//   success: true;
//   data: T;
// };
