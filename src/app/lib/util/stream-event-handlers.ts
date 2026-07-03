import type { Dispatch } from "@reduxjs/toolkit";
import { IncompleteJsonParser } from "incomplete-json-parser";
import z from "zod";
import {
  addMessage,
  type ChatMessageObj,
  MessageComponent,
  removeMessage,
  type StreamingState,
  setStreamingState,
  updateMessage,
} from "@/app/lib/redux/features/chatSlice";
import {
  setArchitectureDoc,
  updateRefreshKey,
} from "@/app/lib/redux/features/projectSlice";
import { parseToolCallValue } from "@/app/lib/util/llm/tool-utils";
import type { ToolCallComponent } from "./supabase/types/tables";
import type { IntegrationManagerProps } from "./types/integration-component";
import {
  type ComponentProps,
  ComponentType,
  createComponent,
  type StreamComponent,
} from "./types/stream-component";
import {
  SupervisorCoderAgentTask,
  SupervisorCoderAgentTaskSchema,
} from "./types/taskAgent";

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
    | "integration_required"
    | "build_complete"
    | "generating_tasks_start"
    | "generating_tasks_completed"
    | "push_supabase_migration_start"
    | "push_supabase_migration_end"
    | "deploy_start"
    | "deploy_complete"
    | "deploy_error"
    | "final_response"
    | "architecture_doc"
    | "stream_end"
    | "error";
  data: Record<string, unknown>;
  timestamp: string;
};

/**
 * @description Context provided to each event handler, functions and arguments needed for managing stream session.
 */
export interface StreamEventContext {
  sessionId: string;
  dispatch: Dispatch;
  getCurrentStreamingState: () => StreamingState;
  getCurrentMessages: () => ChatMessageObj[];
}

/**
 * Base interface for all stream event handlers
 */
export interface StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void;
}

function finalizeStreamingSession(context: StreamEventContext): void {
  const currentStreamingState = context.getCurrentStreamingState();

  if (currentStreamingState.streamingMessageId) {
    if (currentStreamingState.streamingMessageId.startsWith("streaming-")) {
      context.dispatch(
        removeMessage({
          sessionId: context.sessionId,
          messageId: currentStreamingState.streamingMessageId,
        }),
      );
    } else {
      context.dispatch(
        updateMessage({
          sessionId: context.sessionId,
          messageId: currentStreamingState.streamingMessageId,
          updates: {
            is_streaming: false,
            is_typewriter: true,
          },
        }),
      );
    }
  }

  context.dispatch(
    setStreamingState({
      sessionId: context.sessionId,
      streamingState: {
        isStreaming: false,
        currentStatus: "idle",
        streamingMessageId: null,
        toolCalls: [],
      },
    }),
  );
}

/**
 * Utility function to extract value from streaming tool call which becomes the
 * result field in ToolCallItem
 */
function extractToolCallValue(
  //tool: StreamingState["toolCalls"][0]
  name: string,
  args: Record<string, unknown>,
): string | null {
  return parseToolCallValue(name, args);
}

/**
 * Helper class to manage component updates for streaming messages
 */
class ComponentManager {
  constructor(private context: StreamEventContext) {}

  /**
   * Check if a component type is a boundary that finalizes tool groups
   */
  private isBoundaryComponent(componentType: string): boolean {
    return (
      componentType === ComponentType.PROGRESS_UPDATE ||
      componentType === ComponentType.FINAL_ANSWER ||
      componentType === ComponentType.ERROR ||
      componentType === ComponentType.BUILD_PROGRESS ||
      componentType === ComponentType.SUPABASE_MIGRATION ||
      componentType === ComponentType.DEPLOY_PROGRESS ||
      componentType === ComponentType.TASK_LIST ||
      componentType === ComponentType.INTEGRATION
    );
  }

  /**
   * Add a component to the current streaming message
   * Handles incremental grouping of tool calls
   */
  addComponent(component: StreamComponent): void {
    const { streamingMessageId } = this.context.getCurrentStreamingState();
    if (!streamingMessageId) {
      console.warn("No streaming message ID available");
      return;
    }
    //Find current streaming message
    const currentMessages = this.context.getCurrentMessages();
    const message = currentMessages.find(
      (m) => m.message_id === streamingMessageId,
    );

    //Find existing component list
    const existingComponents = message?.components || [];

    // If this is a TOOL_CALL, try to add it to the last TOOL_GROUP
    if (component.type === ComponentType.TOOL_CALL) {
      const lastComponent = existingComponents[existingComponents.length - 1];

      // If last component is a TOOL_GROUP, add this tool call to it
      if (lastComponent?.type === ComponentType.TOOL_GROUP) {
        const toolGroupProps =
          lastComponent.props as ComponentProps[ComponentType.TOOL_GROUP];
        const updatedToolCalls = [
          ...toolGroupProps.toolCalls,
          component.props as ComponentProps[ComponentType.TOOL_CALL],
        ];

        // Update the last component with the new tool call
        const updatedComponents = [...existingComponents];
        updatedComponents[existingComponents.length - 1] = {
          ...lastComponent,
          props: {
            toolCalls: updatedToolCalls,
          },
        };

        this.context.dispatch(
          updateMessage({
            sessionId: this.context.sessionId,
            messageId: streamingMessageId,
            updates: { components: updatedComponents },
          }),
        );
        return;
      }

      // Otherwise, create a new TOOL_GROUP with this tool call
      const newToolGroup = createComponent(ComponentType.TOOL_GROUP, {
        toolCalls: [component.props as ComponentProps[ComponentType.TOOL_CALL]],
      });

      const updatedComponents = [...existingComponents, newToolGroup];

      this.context.dispatch(
        updateMessage({
          sessionId: this.context.sessionId,
          messageId: streamingMessageId,
          updates: { components: updatedComponents },
        }),
      );
      return;
    }

    // For boundary components or other components, just add them normally
    // This finalizes any existing TOOL_GROUP
    const updatedComponents = [...existingComponents, component];

    this.context.dispatch(
      updateMessage({
        sessionId: this.context.sessionId,
        messageId: streamingMessageId,
        updates: { components: updatedComponents },
      }),
    );
  }

  /**
   * Update the last component of a specific type
   */
  updateLastComponent(
    componentType: ComponentType,
    updates: Partial<Record<string, unknown>>,
  ): void {
    const { streamingMessageId } = this.context.getCurrentStreamingState();
    if (!streamingMessageId) return;

    const currentMessages = this.context.getCurrentMessages();
    const message = currentMessages.find(
      (m) => m.message_id === streamingMessageId,
    );

    if (!message?.components) return;

    const components = [...message.components];
    const lastIndex = components.findLastIndex((c) => c.type === componentType);

    if (lastIndex === -1) return;

    components[lastIndex] = {
      ...components[lastIndex],
      props: {
        ...components[lastIndex].props,
        ...updates,
      },
    };

    this.context.dispatch(
      updateMessage({
        sessionId: this.context.sessionId,
        messageId: streamingMessageId,
        updates: { components },
      }),
    );
  }

  /**
   * Update a specific tool call in the last TOOL_GROUP by toolCallId
   */
  updateToolCallInGroup(
    toolCallId: string,
    updates: Partial<ToolCallComponent>,
  ): void {
    const { streamingMessageId } = this.context.getCurrentStreamingState();
    if (!streamingMessageId) return;

    const currentMessages = this.context.getCurrentMessages();
    const message = currentMessages.find(
      (m) => m.message_id === streamingMessageId,
    );

    if (!message?.components) return;

    const components = [...message.components];
    const lastToolGroupIndex = components.findLastIndex(
      (c) => c.type === ComponentType.TOOL_GROUP,
    );

    if (lastToolGroupIndex === -1) return;

    const toolGroup = components[lastToolGroupIndex];
    const toolGroupProps =
      toolGroup.props as ComponentProps[ComponentType.TOOL_GROUP];

    // Find the tool call by toolCallId
    const toolCallIndex = toolGroupProps.toolCalls.findIndex(
      (tc: ToolCallComponent) => tc.toolCallId === toolCallId,
    );

    if (toolCallIndex === -1) return;

    // Update the tool call
    const updatedToolCalls = [...toolGroupProps.toolCalls];
    updatedToolCalls[toolCallIndex] = {
      ...updatedToolCalls[toolCallIndex],
      ...updates,
    };

    // Update the component
    components[lastToolGroupIndex] = {
      ...toolGroup,
      props: {
        toolCalls: updatedToolCalls,
      },
    };

    this.context.dispatch(
      updateMessage({
        sessionId: this.context.sessionId,
        messageId: streamingMessageId,
        updates: { components },
      }),
    );
  }

  /**
   * Initialize a streaming message if it doesn't exist
   */
  ensureStreamingMessage(): string {
    const currentState = this.context.getCurrentStreamingState();

    if (currentState.streamingMessageId) {
      return currentState.streamingMessageId;
    }

    //Create a new streaming message object
    const streamingMessageId = `streaming-${Date.now()}`;
    const streamingMessage: ChatMessageObj = {
      chat_session_id: this.context.sessionId,
      role: "AI",
      content: "",
      created_at: new Date().toISOString(),
      message_id: streamingMessageId,
      is_streaming: true,
      is_typewriter: false,
      hidden: false,
      components: [],
    };

    this.context.dispatch(
      addMessage({
        sessionId: this.context.sessionId,
        message: streamingMessage,
      }),
    );

    this.context.dispatch(
      setStreamingState({
        sessionId: this.context.sessionId,
        streamingState: { streamingMessageId },
      }),
    );

    return streamingMessageId;
  }
}

/**
 * Handler for status_update events
 */
class StatusUpdateHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: event.data.status as StreamingState["currentStatus"],
        },
      }),
    );
  }
}

/**
 * Handler for tool_call_start events
 */
class ToolCallStartHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const toolId = event.data.tool_id as string;
    const toolName = event.data.tool_name as string;
    const toolArgs = (event.data.tool_args as Record<string, unknown>) || {};
    const formattedArgs = String(extractToolCallValue(toolName, toolArgs));

    const currentStreamingState = context.getCurrentStreamingState();
    const newToolCalls = [...currentStreamingState.toolCalls];
    const existingIndex = newToolCalls.findIndex((tool) => tool.id === toolId);

    if (existingIndex >= 0) {
      newToolCalls[existingIndex] = {
        id: toolId,
        name: toolName,
        status: "start",
        args: toolArgs,
        partialContent: "",
      };
    } else {
      newToolCalls.push({
        id: toolId,
        name: toolName,
        status: "start",
        args: toolArgs,
        partialContent: "",
      });
    }

    // Ensure streaming message exists
    const manager = new ComponentManager(context);
    manager.ensureStreamingMessage();

    // Add tool call to message components immediately with "start" status
    // Only add if it's not a special tool (final_answer, progress_update, error)
    if (
      toolName !== "final_answer" &&
      toolName !== "progress_update" &&
      toolName !== "error"
    ) {
      const toolCallComponent: ToolCallComponent = {
        name: toolName,
        args: toolArgs,
        result: formattedArgs,
        status: "start",
        toolCallId: toolId,
      };

      const toolCallStreamComponent = createComponent(
        ComponentType.TOOL_CALL,
        toolCallComponent,
        { toolCallId: toolId },
      );

      manager.addComponent(toolCallStreamComponent);
    }

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: { toolCalls: newToolCalls },
      }),
    );
  }
}

/**
 * Tool Call Token Handler
 */
class ToolCallTokenHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const tokenToolId = event.data.tool_id as string;
    const token = event.data.token as string;

    const currentStreamingState = context.getCurrentStreamingState();
    const newToolCalls = [...currentStreamingState.toolCalls];
    const tokenToolIndex = newToolCalls.findIndex(
      (tool) => tool.id === tokenToolId,
    );

    if (tokenToolIndex >= 0) {
      const existingTool = newToolCalls[tokenToolIndex];
      const updatedContent = existingTool.partialContent + token;

      let updatedArgs: Record<string, unknown>;
      try {
        updatedArgs = IncompleteJsonParser.parse(updatedContent);
      } catch {
        updatedArgs = {};
      }

      newToolCalls[tokenToolIndex] = {
        ...existingTool,
        status: "streaming",
        args: updatedArgs,
        partialContent: updatedContent,
      };

      // Update the tool call status in the message components
      const manager = new ComponentManager(context);
      manager.updateToolCallInGroup(tokenToolId, {
        status: "streaming",
        args: updatedArgs,
      });
    }

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: { toolCalls: newToolCalls },
      }),
    );
  }
}

/**
 * Tool Call Complete Handler - Creates unified StreamComponents
 */
class ToolCallCompleteHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const toolId = event.data.tool_id as string;
    const currentStreamingState = context.getCurrentStreamingState();

    const toolIndex = currentStreamingState.toolCalls.findIndex(
      (tool) => tool.id === toolId,
    );

    if (toolIndex < 0) return;

    const tool = currentStreamingState.toolCalls[toolIndex];
    const finalArgs =
      (event.data.final_args as Record<string, unknown>) || tool.args;

    // Update tool status to mark it as completed.
    const newToolCalls = [...currentStreamingState.toolCalls];
    newToolCalls[toolIndex] = {
      ...tool,
      status: "complete",
      args: finalArgs,
    };

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: { toolCalls: newToolCalls },
      }),
    );

    const manager = new ComponentManager(context);

    // Check if this is a special tool that gets its own component
    const isSpecialTool =
      tool.name === "final_answer" ||
      tool.name === "progress_update" ||
      tool.name === "error";

    if (isSpecialTool) {
      // Create unified component for special tools
      const component = this.createComponentFromTool(
        tool.name,
        finalArgs,
        toolId,
      );
      if (component) {
        manager.addComponent(component);
        //console.log("✅ Special component added to message", component);
      }
    } else {
      // Update existing tool call in the group to mark as complete
      const result = String(extractToolCallValue(tool.name, finalArgs));
      manager.updateToolCallInGroup(toolId, {
        status: "complete",
        args: finalArgs,
        result: result,
      });
      //console.log("✅ Tool call updated to complete", { toolId, toolName: tool.name });
    }
  }

  /**
   * Map tool calls to unified StreamComponent types
   */
  private createComponentFromTool(
    toolName: string,
    args: Record<string, unknown>,
    toolId: string,
  ): StreamComponent | null {
    switch (toolName) {
      case "final_answer":
        return createComponent(
          ComponentType.FINAL_ANSWER,
          {
            content: String(args.content || args.summary || ""),
            agent: String(args.agent || "unknown"),
          },
          { toolCallId: toolId },
        );

      case "progress_update":
        return createComponent(
          ComponentType.PROGRESS_UPDATE,
          {
            content: String(args.update || ""),
            //progress: args.progress as number | undefined,
          },
          { toolCallId: toolId },
        );

      // case "request_user_input":
      //   return createComponent(
      // 	ComponentType.USER_INPUT,
      // 	{
      // 	  prompt: String(args.prompt || args.message || ""),
      // 	  inputType: String(args.input_type || "text"),
      // 	},
      // 	{ toolCallId: toolId }
      //   );

      case "error":
        return createComponent(
          ComponentType.ERROR,
          {
            message: String(args.message || "An error occurred"),
            code: String(args.code || ""),
            details: args.details,
          },
          { toolCallId: toolId },
        );

      //Assume create a tool call component for all other tools
      default:
        return createComponent(
          ComponentType.TOOL_CALL,
          {
            name: toolName,
            args,
            result: String(extractToolCallValue(toolName, args)),
          },
          { toolCallId: toolId },
        );
    }
  }
}

/**
 * Handler for tool_call_complete events
 */
// class ToolCallCompleteHandler implements StreamEventHandler {
//   handle(event: StreamEvent, context: StreamEventContext): void {
//     const completeToolId = event.data.tool_id as string;

//     const currentStreamingState = context.getCurrentStreamingState();
//     const newToolCalls = [...currentStreamingState.toolCalls];

// 	//Find the tool call that was started to complete it
//     const completeToolIndex = newToolCalls.findIndex(
//       (tool) => tool.id === completeToolId
//     );

// 	//Completed tool found
//     if (completeToolIndex >= 0) {
//       const existingTool = newToolCalls[completeToolIndex];

// 	  //Update the previous tool start object to a completed tool object
//       const completedTool = {
//         ...existingTool,
//         status: "complete" as const,
//         args:
//           (event.data.final_args as Record<string, unknown>) ||
//           existingTool.args,
//       };

//       newToolCalls[completeToolIndex] = completedTool;

// 	  //Use the args from event to custom display text for tool group item component.
//       const toolValue = extractToolCallValue(completedTool);
// 	  console.log("COMPLETED TOOL FOUND AND EXTRACTED", toolValue)

// 	  //If streaming message exists and we get a text to display to frontend
//       if (currentStreamingState.streamingMessageId && toolValue != null) {
//         // const completedToolComponent: ToolCallComponent = {
//         //   name: completedTool.name,
//         //   value: toolValue,
//         // };
// 		console.log("CURRENT STREAMIN MESSAGE ID ", currentStreamingState.streamingMessageId)
//         const currentMessages = context.getCurrentMessages();
//         const currentMessage = currentMessages.find(
//           (m) => m.message_id === currentStreamingState.streamingMessageId
//         );

// 		//Response group is what we type the message component if its the builder agent streaming
// 		//Represents the whole message and all the components and tool calls inside.
//         let responseGroup: MessageComponent;
//         if (
//           currentMessage?.message_component &&
//           (currentMessage.message_component as MessageComponent).type ===
//             "responseGroup"
//         ) {
//           responseGroup = currentMessage.message_component as MessageComponent;
// 		  console.log("Existing response group found", responseGroup)
//         } else {
//           responseGroup = {
//             type: "responseGroup",
//             props: { toolCalls: [] },
//           };
//         }

// 		// Check if it's a final_answer tool
//         let componentToAdd: ToolCallComponent | MessageComponent;

// 		//If tool is final answer, we add a component as a MessageComponent so it can be displayed as its own
// 		//component
//         if (completedTool.name === "final_answer") {
//           // Convert final_answer to a MessageComponent
//           componentToAdd = {
//             type: "finalAnswer",
//             props: {
//               content: toolValue,
//               //agent: completedTool.args.agent || "unknown", // Optional: track which agent
//             },
//           };
//         } else {
//           // Regular tool call
//           componentToAdd = {
//             name: completedTool.name,
//             value: toolValue,
//           };
// 		}
// 		console.log("COMPONENT TO ADD", componentToAdd)
// 		//Updates the entire builder agent response
//         const updatedResponseGroup: MessageComponent = {
//           ...responseGroup,
//           props: {
//             toolCalls: [
//               ...(responseGroup.props?.toolCalls || []),
//               //completedToolComponent,
// 			  componentToAdd
//             ],
//           },
//         };
// 		console.log("Tool Call Completed Handler", event.data)
// 		console.log("UPDATED RESPONSE GROUP", updatedResponseGroup)
//         // let updatedContent = currentMessage?.content || "";
//         // if (completedTool.name === "output_message") {
//         //   updatedContent = toolValue;
//         // }

//         context.dispatch(
//           updateMessage({
//             sessionId: context.sessionId,
//             messageId: currentStreamingState.streamingMessageId,
//             updates: {
//               message_component: updatedResponseGroup,
//               //content: updatedContent,
//               is_typewriter:
//                 completedTool.name === "progress_update" ||
//                 completedTool.name === "request_user_input" ||
//                 completedTool.name === "normal_response",
//             },
//           })
//         );
//       }
//     }

//     context.dispatch(
// 		setStreamingState({
// 			sessionId: context.sessionId,
// 			streamingState: {
// 				toolCalls: newToolCalls,
// 			},
// 		})
// 	);
// 	console.log("Tool Call complete tool calls state", newToolCalls)
// 	}
// }

/**
 * Handler for build_start events
 */
class BuildStartHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const buildProgressComp = createComponent(ComponentType.BUILD_PROGRESS, {
      status: "building",
      message: "Compiling your application...",
    });

    const manager = new ComponentManager(context);
    manager.addComponent(buildProgressComp);

    //console.log("✅ Build component", buildProgressComp);

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          buildStatus: "building",
          currentStatus: "building",
        },
      }),
    );
  }
}

/**
 * Handler for build_complete events
 */
class BuildCompleteHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const success = event.data.success as boolean;
    const message = event.data.message as string;
    const buildOutput = event.data.buildOutput as string;
    const error = event.data.error as string;

    // Update the last BUILD_PROGRESS component
    const manager = new ComponentManager(context);
    manager.updateLastComponent(ComponentType.BUILD_PROGRESS, {
      status: success ? "success" : "failed",
      message:
        message || (success ? "Build completed successfully" : "Build failed"),
      buildOutput: success ? buildOutput : undefined,
      error: !success ? error : undefined,
    });

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          buildStatus: event.data.success ? "success" : "failed",
        },
      }),
    );
  }
}

/**
 * Handler for integration_required events
 */
class IntegrationRequiredHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const integrationData = event.data.props as IntegrationManagerProps;

    const integrationComponent = createComponent(ComponentType.INTEGRATION, {
      integrationProps: integrationData,
    });

    const manager = new ComponentManager(context);
    manager.addComponent(integrationComponent);
  }
}

/**
 * Handler for push_supabase_migration_start events
 */
class PushSupabaseMigrationStartHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const message =
      (event.data.message as string) || "Pushing Supabase migration...";

    const migrationComp = createComponent(ComponentType.SUPABASE_MIGRATION, {
      status: "pushing",
      message,
    });

    const manager = new ComponentManager(context);
    manager.addComponent(migrationComp);

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "pushing_migration",
        },
      }),
    );
  }
}

/**
 * Handler for push_supabase_migration_end events
 */
class PushSupabaseMigrationEndHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const success = event.data.success as boolean;
    const message = event.data.message as string;
    const error = event.data.error as string;

    const manager = new ComponentManager(context);
    manager.updateLastComponent(ComponentType.SUPABASE_MIGRATION, {
      status: success ? "success" : "failed",
      message:
        message ||
        (success ? "Migration pushed successfully" : "Migration failed"),
      error: !success ? error : undefined,
    });

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "coding",
        },
      }),
    );
  }
}

/**
 * Handler for deploy_start events
 */
class DeployStartHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const message =
      (event.data.message as string) || "Deploying your application...";

    const deployComp = createComponent(ComponentType.DEPLOY_PROGRESS, {
      status: "deploying",
      message,
    });

    const manager = new ComponentManager(context);
    manager.addComponent(deployComp);

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          deployStatus: "deploying",
          currentStatus: "deploying",
        },
      }),
    );
  }
}

/**
 * Handler for deploy_complete events
 */
class DeployCompleteHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const success = event.data.success as boolean;
    const message = event.data.message as string;

    const manager = new ComponentManager(context);
    manager.updateLastComponent(ComponentType.DEPLOY_PROGRESS, {
      status: success ? "success" : "failed",
      message:
        message || (success ? "Deployed successfully" : "Deployment failed"),
    });

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          deployStatus: success ? "success" : "failed",
          refreshingPreview: success ? true : false,
        },
      }),
    );

    //Update refresh key to update preview iframe
    context.dispatch(updateRefreshKey());
  }
}

/**
 * Handler for deploy_error events
 */
class DeployErrorHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const message = (event.data.message as string) || "Deployment failed";
    const error = event.data.error as string;

    const manager = new ComponentManager(context);
    manager.updateLastComponent(ComponentType.DEPLOY_PROGRESS, {
      status: "failed",
      message,
      error: error || message,
    });

    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          deployStatus: "failed",
        },
      }),
    );
  }
}

/**
 * Handler for generating_task_start event
 */
class GeneratingTasksStart implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "generating_tasks",
        },
      }),
    );
  }
}

/**
 * Handler for generating_task_completed event
 */
class GeneratingTasksComplete implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    // Validate just the task_list array
    const taskListSchema = z.array(SupervisorCoderAgentTaskSchema);
    const result = taskListSchema.safeParse(event.data.task_list);

    if (!result.success) {
      console.error("Invalid task list data:", result.error);
      return;
    }

    const taskList = result.data;
    const totalTasks = taskList.length;

    // Create task list component
    const taskListComponent = createComponent(ComponentType.TASK_LIST, {
      tasks: taskList,
      totalTasks,
    });

    // Add to streaming message
    const manager = new ComponentManager(context);
    manager.addComponent(taskListComponent);

    // Update status
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          currentStatus: "coding",
        },
      }),
    );

    // Store in streaming state LEGACY
    // context.dispatch(
    // 	setStreamingState({
    // 		sessionId: context.sessionId,
    // 		streamingState: { taskList: taskList },
    // 	})
    // );
  }
}

/**
 * Handler for final_response events from each agent, basically a summary of their actions.
 * Previously used to stop streaming now it should be kept open
 */
class AgentFinalResponseHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const content = event.data.content as string;
    const agent = event.data.agent as string;

    const finalAnsComp = createComponent(ComponentType.FINAL_ANSWER, {
      content,
      agent,
    });

    // Add components to streaming message
    const manager = new ComponentManager(context);
    manager.addComponent(finalAnsComp);
  }
}

/**
 * Handler for architecture_doc events from build agent stream.
 * Updates project slice so the Architecture tab can show the doc without a separate fetch or websocket.
 */
class ArchitectureDocHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    const markdown =
      event.data.content ?? event.data.markdown ?? event.data.architecture_doc;
    if (typeof markdown === "string") {
      context.dispatch(setArchitectureDoc(markdown));
    }
  }
}

class StreamEndHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    finalizeStreamingSession(context);
  }
}

/**
 * Handler for error events
 */
class ErrorHandler implements StreamEventHandler {
  handle(event: StreamEvent, context: StreamEventContext): void {
    finalizeStreamingSession(context);
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: {
          error: (event.data.message as string) || "An error occurred",
        },
      }),
    );
  }
}

/**
 * Registry that maps event types to their handlers
 */
export class StreamEventHandlerRegistry {
  private handlers: Map<string, StreamEventHandler> = new Map();

  constructor() {
    // Register default handlers
    this.register("status_update", new StatusUpdateHandler());
    this.register("tool_call_start", new ToolCallStartHandler());
    this.register("tool_call_token", new ToolCallTokenHandler());
    this.register("tool_call_complete", new ToolCallCompleteHandler());
    this.register("build_start", new BuildStartHandler());
    this.register("build_complete", new BuildCompleteHandler());
    this.register("integration_required", new IntegrationRequiredHandler());
    this.register(
      "push_supabase_migration_start",
      new PushSupabaseMigrationStartHandler(),
    );
    this.register(
      "push_supabase_migration_end",
      new PushSupabaseMigrationEndHandler(),
    );
    this.register("deploy_start", new DeployStartHandler());
    this.register("deploy_complete", new DeployCompleteHandler());
    this.register("deploy_error", new DeployErrorHandler());
    this.register("generating_tasks_start", new GeneratingTasksStart());
    this.register("generating_tasks_completed", new GeneratingTasksComplete());
    this.register("final_answer", new AgentFinalResponseHandler());
    this.register("architecture_doc", new ArchitectureDocHandler());
    this.register("stream_end", new StreamEndHandler());
    //Could add the web container complete handler here
    this.register("error", new ErrorHandler());
  }

  /**
   * Register a new handler for an event type
   */
  register(eventType: string, handler: StreamEventHandler): void {
    this.handlers.set(eventType, handler);
  }

  /**
   * Get the handler for a specific event type
   */
  get(eventType: string): StreamEventHandler | undefined {
    return this.handlers.get(eventType);
  }

  /**
   * Handle an event by delegating to the appropriate handler
   */
  handle(event: StreamEvent, context: StreamEventContext): void {
    // Always update current event in state
    context.dispatch(
      setStreamingState({
        sessionId: context.sessionId,
        streamingState: { currentEvent: event },
      }),
    );

    const handler = this.get(event.type);
    if (handler) {
      handler.handle(event, context);
    } else {
      console.warn(`No handler registered for event type: ${event.type}`);
    }
  }
}

/**
 * Create a singleton instance of the registry
 */
export const streamEventRegistry = new StreamEventHandlerRegistry();
