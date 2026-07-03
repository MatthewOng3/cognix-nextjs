// types/component-types.ts

import { ToolCallComponent } from "../supabase/types/tables";
import { IntegrationManagerProps } from "./integration-component";
import { SupervisorCoderAgentTask } from "./taskAgent";

/**
 * Universal component structure for all AI responses
 */
export interface StreamComponent {
    type: string;  // Component type identifier
    props: Record<string, unknown>;  // Component-specific data
    metadata?: {
      timestamp?: string;
      agentId?: string;
      toolCallId?: string;  // For backwards compatibility
    };
  }

/**
 * All available component types in the system
 */
export enum ComponentType {
    // Text-based components
    TEXT = "text",
    MARKDOWN = "markdown",
    FINAL_ANSWER = "finalAnswer",
    
    // Action components  
    TOOL_CALL = "toolCall",
    TOOL_GROUP = "toolGroup",
    

    BUILD_PROGRESS = "buildProgress",
    SUPABASE_MIGRATION = "supabaseMigration",
    DEPLOY_PROGRESS = "deployProgress",

    // Progress components
    PROGRESS_UPDATE = "progressUpdate",
    STATUS_UPDATE = "statusUpdate",
    
    // Task components
    TASK_LIST = "taskList",
    TASK_UPDATE = "taskUpdate",
    
    // Interactive components
    INTEGRATION = "integration",
    USER_INPUT = "userInput",
    
    // System components
    ERROR = "error",
    WARNING = "warning",
  }
  
  /**
   * Type-safe component props definitions
   */
  export interface ComponentProps {
    [ComponentType.TEXT]: { content: string };
    [ComponentType.MARKDOWN]: { content: string };
    [ComponentType.FINAL_ANSWER]: { content: string; agent?: string };
    
    [ComponentType.TOOL_CALL]: ToolCallComponent
    
    [ComponentType.TOOL_GROUP]: {
      toolCalls: ComponentProps[ComponentType.TOOL_CALL][];
    };
    
    [ComponentType.PROGRESS_UPDATE]: {
      content: string;
    };
    
    [ComponentType.TASK_LIST]: {
        tasks: SupervisorCoderAgentTask[];
        totalTasks: number;
    };
    
    [ComponentType.INTEGRATION]: {
      integrationProps: IntegrationManagerProps
    };
    
    [ComponentType.BUILD_PROGRESS]: {
        status: string;
		message?: string;
		error?: string;
		buildOutput?: string;
	}

    [ComponentType.SUPABASE_MIGRATION]: {
        status: "pushing" | "success" | "failed";
        message?: string;
        error?: string;
    }

    [ComponentType.DEPLOY_PROGRESS]: {
        status: "deploying" | "success" | "failed";
        message?: string;
        error?: string;
    }

    [ComponentType.ERROR]: {
      message: string;
      code?: string;
      details?: unknown;
    };
  }
  
  /**
   * Type-safe component creator
   */
  export function createComponent<T extends keyof ComponentProps>(
    type: T,
    props: ComponentProps[T],
    metadata?: StreamComponent["metadata"]
  ): StreamComponent {
    return {
      type,
      props: props as Record<string, unknown>,
      metadata,
    };
  }

  /**
 * Type guard to check if object is a valid StreamComponent
 */
export function isStreamComponent(obj: unknown): obj is StreamComponent {
    if (!obj || typeof obj !== "object") return false;
    
    const component = obj as Partial<StreamComponent>;
    
    return (
      typeof component.type === "string" &&
      component.props !== undefined &&
      typeof component.props === "object" &&
      component.props !== null
    );
  }
 
  