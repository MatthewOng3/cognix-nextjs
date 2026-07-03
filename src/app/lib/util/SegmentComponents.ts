import type { ToolCallComponent } from "@/app/lib/util/supabase/types/tables";
import type { MessageComponent } from "@/app/components/ComponentRenderer";

/**
 * Union type - makes it clear we accept both formats
 */
type ResponseGroupItem = ToolCallComponent | MessageComponent;

/**
 * Type guards for clarity and type safety
 */
function isMessageComponent(item: ResponseGroupItem): item is MessageComponent {
  return 'type' in item && typeof item.type === 'string' && 'props' in item;
}

function isStandaloneMessage(toolCall: ToolCallComponent): boolean {
  return toolCall.name === "progress_update" || toolCall.name === "request_user_input";
}

function isErrorToolCall(toolCall: ToolCallComponent): boolean {
  return toolCall.name === "error";
}


/**
 * @description Normalize raw tool calls OR message components into segmented MessageComponents such that it can be used
 * by Component Renderer. Also seperates responseGroup old name, value format into new MessageComponents , and segments into multiple components to be rendered
 * as part of 1 message item. 
 * Essentially groups tool calls together and segments progress updates in the entire message object. 
 * Breaks up responseGroup type list of objects into different segments. 
 * Now additionally segements task list into a seperate group from tool call group.
 */
export function segmentComponents(
  items: (ToolCallComponent | MessageComponent)[]
): MessageComponent[] {
  const components: MessageComponent[] = [];
  let currentToolGroup: ToolCallComponent[] = [];
 
  const flushToolGroup = () => {
    if (currentToolGroup.length > 0) {
      components.push({
        type: "toolGroup",
        props: { toolCalls: [...currentToolGroup] },
      });
      currentToolGroup = [];
    }
  };
  
  for (const item of items) {
    // Already a built MessageComponent? (taskList, integration, finalAnswer etc.)
    if (isMessageComponent(item)) {
      flushToolGroup();
      components.push(item);
      continue;
    }

    // From here on, we know it's a ToolCallComponent
    const toolCall = item as ToolCallComponent;

    // Standalone message tool calls
    if (isStandaloneMessage(toolCall)) {
      flushToolGroup();
      components.push({
        type: "message",
        props: { content: toolCall.result },
      });
      continue;
    }

    // Error tool calls
    if (isErrorToolCall(toolCall)) {
      flushToolGroup();
      components.push({
        type: "error",
        props: { message: toolCall.result },
      });
      continue;
    }

    // Regular tool call - add to group
    currentToolGroup.push(toolCall);
  }

  flushToolGroup();
  return components;
}
	// for (const item of items) {
  //   // Check if this is already a MessageComponent (not a plain ToolCallComponent)
  //   //TODO IMPROVE THIS CODE
  //   if ('type' in item && item.type === 'taskList') {
  //     // It's a MessageComponent like taskList, integration, etc.
  //     flushToolGroup();  // Flush any pending tool group
  //     components.push(item as unknown as MessageComponent);  // Add it directly
  //     continue;
  //   }
    
	// 	const isMessageTool =
	// 	item.name === "progress_update" || item.name === "request_user_input";
	// 	const isErrorTool = item.name === "error";

	// 	if (isMessageTool) {

  //     flushToolGroup();
      
  //     // Add the message as a separate segment
  //     if (item.value) {
  //       components.push({
  //         type: "message",
  //         props: { content: item.value },
  //       });
  //     }

  //     } else if (isErrorTool) {
  //       flushToolGroup();
  //       components.push({
  //         type: "error",
  //         props: { message: item.value },
  //       });
	// 	} else {
	// 		currentToolGroup.push(item);
	// 	}

