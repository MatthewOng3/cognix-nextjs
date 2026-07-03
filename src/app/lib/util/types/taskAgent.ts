import { z } from "zod";

// Shared literal type
export type TaskType = "Backend" | "Frontend" | "Fullstack";

/**
 * BackendContract
 * Mirrors Pydantic: extra="forbid"
 */
export interface BackendContract {
  api_endpoint: string;      // empty string if not needed
  request_schema: Record<string, unknown> | string | null;    // Empty string or dict
  response_schema: Record<string, unknown> | string | null;   // Empty string or dict
}

/**
 * TaskContext
 */
export interface TaskContext {
  task_context: string;      // empty string if not needed
  file_dependencies: string[]; // empty array if none
}

/**
 * SupervisorCoderAgentSubtask
 */
export interface SupervisorCoderAgentSubtask {
  type: TaskType;
  instructions: string;
  instruction_summary: string[];
  context: TaskContext;
  contract: BackendContract; // empty strings if not needed
}

/**
 * SupervisorCoderAgentTask
 */
export interface SupervisorCoderAgentTask {
  type: TaskType;
  instructions: string;
  instruction_summary: string[];
  context: TaskContext;
  subtasks: SupervisorCoderAgentSubtask[]; // empty array if none
  contract: BackendContract;               // empty strings if not needed
}

// Zod schema for the above type
export const SupervisorCoderAgentTaskSchema = z.object({
    type: z.enum(["Backend", "Frontend", "Fullstack"]),
    instructions: z.string(),
    instruction_summary: z.array(z.string()), 
    context: z.object({
      task_context: z.string(),
      file_dependencies: z.array(z.string()),
    }),
    subtasks: z.array(z.any()),
    contract: z.object({
      api_endpoint: z.string(),
      request_schema: z.union([z.string(), z.record(z.string(), z.unknown())]).nullable(),
      response_schema: z.union([z.string(), z.record(z.string(), z.unknown())]).nullable(),
    }),
});