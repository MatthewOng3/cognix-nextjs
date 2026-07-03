/* eslint-disable */
//================Schema for Supabase Tables================
 
import { MessageComponent } from "@/app/lib/redux/features/chatSlice";
import { StreamComponent } from "../../types/stream-component";
export type FlowState = {
  projectId: string | undefined;
  plannerSessionId: string | undefined;
  userId: string | undefined;
  stepIndex: number;
};

// types/supabase.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  dev: {
    Tables: {
      project_deployment: {
        Row: ProjectDeploymentSchema;
        Insert: {
          id?: string;
          project_id: string;
          session_id: string;
          git_sha: string;
          is_successful?: boolean | null;
          status?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          session_id?: string;
          git_sha?: string;
          is_successful?: boolean | null;
          status?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
  prod: {
    Tables: {
      project_deployment: Database["dev"]["Tables"]["project_deployment"];
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};


export type User = {
  user_id: string | undefined;
  plan_id: string;
  is_premium: boolean;
  last_login: string;
  created_at: string;
  completed_onboarding: boolean;
  onboarding_state: FlowState;
};

export type Project = {
  project_id: string;
  project_name: string;
  user_id: string;
  description: string;
  status: "Draft" | "Active";
  generated_prd: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  repo_id: string;
  repo_url: string;
  preview_url: string;
  document_markdown: string;
  dokku_app_name: string;
  document_json: Record<string, any>;
};

export type ChatSession = {
  chat_session_id: string; //PK
  project_id: string; //FK
  user_id: string; //FK
  chat_type: "Builder" | "Planner";
  created_at: Date;
  updated_at: Date;
};

export type ChatContentComponentType = {
  component_type: "integration" | "image" | "checklist";
  component_props: Record<string, any>;
}

// export type ToolCallComponent = {
//   name: string;
//   value: string;
// };
export type ToolCallComponent = {
  name: string;
  args: Record<string, unknown>;
  result: string;
  status?: "start" | "streaming" | "complete"; // Track tool call progress
  toolCallId?: string; // Track the tool call ID for updates
};

export type ChatHistory = {
  message_id: string; //PK, integer
  chat_session_id: string; //FK, uuid
  role: "User" | "AI";
  content: string;
  // New fields for custom components
  // content_component?: ChatContentComponentType
  created_at: string;
  components?: StreamComponent[];  
};

export type BuilderChatResponse = ChatHistory & {
  ai_response: string;
};

export type StorageObject = {
  id: string;
  bucket_id: string;
  name: string;
  owner: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  last_accessed_at: string | null;
  metadata: Record<string, any> | null;
  path_tokens: string[]; // path split into tokens
  version: string;
  owner_id: string;
  user_metadata: Record<string, any> | null;
};

export type IntegrationSchema = {
  id: number; //PK
  integration_id: string; //UUID, Unique
  service_name: string;
  category: string;
  is_active: boolean;
  description: string;
  icon_path: string;
  created_at: string;
}

export type OauthPkceSchema = {
  id: string; //PK , hash generated on backend
  code_verifier: string;
  redirect_uri: string;
  project_id: string;
  integration_id: string;
  created_at: string;
  project_name: string;
}

export type ProjectDeploymentSchema = {
  id: number;
  project_id: string;
  session_id: string;
  git_sha: string;
  branch: string;
  status: string;
  error_message: string;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  is_successful: boolean;
}

export type UserProductionDeploymentSchema = {
  id: string;
  project_id: string;
  prod_dokku_status: string;
  prod_app_name: string;
  prod_url: string;
  last_deploy_status: string;
  last_deploy_at: string;
  last_deploy_error: string;
}
// type ChatHistoryMessage = {
//     message_id: string; //PK, int
//     sender: 'User' | 'AI';
//     content: string;
//     created_at: Date;
// }
