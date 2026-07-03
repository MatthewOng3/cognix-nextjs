/* eslint-disable */

export type StreamEvent = {
  type:
    | "status_update"
    | "ai_message_start"
    | "ai_message_token"
    | "ai_message_complete"
    | "tool_call_start"
    | "tool_call_token"
    | "tool_call_complete"
    | "build_start"
    | "build_complete"
    | "deploy_start"
    | "deploy_complete"
    | "integration_required"
    | "integration_step"
    | "integration_complete"
    | "final_response"
    | "error";
  data: Record<string, unknown>;
  timestamp: string;
};

export type StreamingState = {
  isStreaming: boolean;
  currentEvent: StreamEvent | null;
  currentStatus:
    | "idle"
    | "planning"
    | "thinking"
    | "coding"
    | "building"
    | "deploying"
    | "integrating";
  currentAiMessage: string;
  isReceivingAiMessage: boolean;
  toolCalls: Array<{
    id: string;
    name: string;
    status: "start" | "streaming" | "complete";
    args: Record<string, unknown>;
    partialContent: string;
  }>;
  buildStatus: "idle" | "building" | "success" | "failed";
  deployStatus: "idle" | "deploying" | "success" | "failed";
  integrationFlow: {
    isActive: boolean;
    type: string | null;
    currentStep: number;
    totalSteps: number;
    flow: any | null;
  };
  error: string | null;
};
