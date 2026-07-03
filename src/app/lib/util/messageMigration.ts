// utils/messageMigration.ts
import type { ToolCallComponent } from '@/app/lib/util/supabase/types/tables';
import type { MessageComponent } from '@/app/components/ComponentRenderer';

/**
 * Migrates legacy ToolCallComponent[] to new MessageComponent[] format
 * This maintains the same segmentation logic as the original MessageRenderer
 */
export function migrateToolCallsToComponents(toolCalls: ToolCallComponent[]): MessageComponent[] {
  const components: MessageComponent[] = [];
  let currentToolGroup: ToolCallComponent[] = [];

  const flushToolGroup = () => {
    if (currentToolGroup.length > 0) {
      components.push({
        type: 'toolGroup',
        props: {
          toolCalls: [...currentToolGroup],
        },
      });
      currentToolGroup = [];
    }
  };

  for (const toolCall of toolCalls) {
    if (toolCall.name === 'output_message' || toolCall.name === 'final_answer') {
      flushToolGroup();
      components.push({
        type: toolCall.name,
        props: { content: toolCall.result },
      });
    } else if (toolCall.name === 'error') {
      flushToolGroup();
      components.push({
        type: 'error',
        props: { message: toolCall.result },
      });
    } else {
      currentToolGroup.push(toolCall);
    }
  }

  flushToolGroup();
  return components;
}

/**
 * Creates a simple message component for text content
 */
export function createTextMessageComponent(content: string): MessageComponent {
  return {
    type: 'output_message',
    props: { content },
  };
}

// /**
//  * Creates a tool group component with the given tool calls
//  */
// export function createToolGroupComponent(toolCalls: ToolCallComponent[]): MessageComponent {
//   return {
//     type: 'toolGroup',
//     props: { toolCalls },
//   };
// }

/**
 * Creates an integration component
 */
export function createIntegrationComponent(
  serviceName: string,
  projectId: string,
  chatSessionId: string,
  currentStep: number = 0,
  status: 'pending' | 'in_progress' | 'completed' = 'pending',
  threadId?: string
): MessageComponent {
  return {
    type: 'integration',
    props: {
      serviceName,
      projectId,
      chatSessionId,
      currentStep,
      status,
      threadId,
    },
  };
}

/**
 * Creates a final answer component
 */
export function createFinalAnswerComponent(content: string): MessageComponent {
  return {
    type: 'final_answer',
    props: { content },
  };
}

/**
 * Example usage for creating complex messages
 */
export function createIntegrationMessage(
  initialMessage: string,
  toolCalls: ToolCallComponent[],
  integrationService: string,
  projectId: string,
  chatSessionId: string,
  finalMessage: string
): MessageComponent[] {
  return [
    createTextMessageComponent(initialMessage),
    // createToolGroupComponent(toolCalls),
    createIntegrationComponent(integrationService, projectId, chatSessionId),
    createFinalAnswerComponent(finalMessage),
  ];
}
