import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LiveActivityIndicator } from "@/app/components/LiveActivityIndicator";
import { ComponentRenderer, type MessageComponent } from "@/app/components/ComponentRenderer";
import { segmentComponents } from "../lib/util/SegmentComponents";
import { ComponentProps, ComponentType, createComponent, StreamComponent } from "../lib/util/types/stream-component";

interface MessageRendererProps {
  content: string | null;
  components: StreamComponent[]; 
  isTypewriter?: boolean;
  displayedText?: string;
  isStreaming?: boolean;
  currentStatus?: string;
}

// The grouping function
// Handles both already-grouped tool calls (from incremental grouping) and legacy ungrouped tool calls
function groupToolCalls(components: StreamComponent[]): StreamComponent[] {
	const grouped: StreamComponent[] = [];
	let currentGroup: ComponentProps[ComponentType.TOOL_CALL][] = [];
  
	for (const component of components) {
	  if (component.type === ComponentType.TOOL_CALL) {
		// Accumulate regular tool calls (legacy case - should be rare now)
		currentGroup.push(component.props as ComponentProps[ComponentType.TOOL_CALL]);
	  } else if (component.type === ComponentType.TOOL_GROUP) {
		// Already grouped - flush any pending ungrouped tools first, then add the group
		if (currentGroup.length > 0) {
		  grouped.push(
			createComponent(ComponentType.TOOL_GROUP, {
			  toolCalls: currentGroup
			})
		  );
		  currentGroup = [];
		}
		// Add the already-grouped component
		grouped.push(component);
	  } else {
		// Hit a boundary (progress update, final answer, etc.)
		if (currentGroup.length > 0) {
		  // FLUSH: Create TOOL_GROUP from accumulated tools
		  grouped.push(
			createComponent(ComponentType.TOOL_GROUP, {
			  toolCalls: currentGroup
			})
		  );
		  currentGroup = [];
		}
		grouped.push(component);
	  }
	}
	// CRITICAL: Flush any remaining tools at the end! As it might not hit a non tool group boundary yet.
	if (currentGroup.length > 0) {
		grouped.push(
			createComponent(ComponentType.TOOL_GROUP, {
				toolCalls: currentGroup
			})
		);
	}
	
	return grouped;
  }

export function MessageRenderer({
  content,
  components, // Legacy tool calls
  // messageComponents, // New registry components
  isTypewriter = false,
  displayedText, //Basically content but with typewriter effect
  isStreaming = false,
  currentStatus = "idle",
}: MessageRendererProps) {
  // let finalComponents: MessageComponent[] = [];

  // if (messageComponent && messageComponent.type === "responseGroup") {
  //   finalComponents = segmentComponents(messageComponent.props.toolCalls);
  // }
  // else if(messageComponent){
  //   finalComponents.push(messageComponent)
  // }
  
  // Determine what text to show, content with type writer effect or without
  const textToShow = isTypewriter ? displayedText || "" : content;
  const shouldShowText = !!textToShow && textToShow.trim().length > 0 && components.length <= 0;
  
  //console.log("🔍 MessageRenderer - Raw components:", components);
  // Group the individual TOOL_CALL components before rendering
  const groupedComponents = groupToolCalls(components);
  
  //console.log("🔍 MessageRenderer - Grouped components:", groupedComponents);

  return (
    <motion.div
      className={`space-y-3 w-full max-w-full ${isStreaming ? "relative" : ""}`}
      animate={
        isStreaming
          ? {
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0)",
                "0 0 0 4px rgba(59, 130, 246, 0.1)",
                "0 0 0 0 rgba(59, 130, 246, 0)",
              ],
              borderColor: [
                "rgba(229, 231, 235, 1)",
                "rgba(59, 130, 246, 0.3)",
                "rgba(229, 231, 235, 1)",
              ],
            }
          : {}
      }
      transition={{ duration: 2, repeat: isStreaming ? Infinity : 0 }}
      style={{
        border: isStreaming ? "1px solid" : "none",
        borderRadius: isStreaming ? "8px" : "0",
        padding: isStreaming ? "12px" : "0",
      }}
    >
      {/* Live activity indicator for streaming */}
      <AnimatePresence>
        {isStreaming && (
          <LiveActivityIndicator
            isStreaming={isStreaming}
            currentStatus={currentStatus}
          />
        )}
      </AnimatePresence>

      {/* Render all components */}
      <AnimatePresence mode="popLayout">
        {groupedComponents.map((component, index) => (
          <motion.div
            key={`${component.type}-${component.metadata?.toolCallId || index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="w-full max-w-full"
          >
            <ComponentRenderer
              component={component}
              isStreaming={isStreaming}
              animationDelay={index * 0.1}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Optional text content */}
      {shouldShowText && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: components.length * 0.1 }}
          className="pt-2 text-base leading-relaxed w-full max-w-full break-words"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {textToShow}
          </ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  );

  // if (finalComponents.length > 0) {
  //   return (
  //     <motion.div
  //       className={`space-y-3 ${isStreaming ? "relative" : ""}`}
  //       animate={isStreaming ? {
  //         boxShadow: [
  //           "0 0 0 0 rgba(59, 130, 246, 0)",
  //           "0 0 0 4px rgba(59, 130, 246, 0.1)",
  //           "0 0 0 0 rgba(59, 130, 246, 0)",
  //         ],
  //         borderColor: [
  //           "rgba(229, 231, 235, 1)",
  //           "rgba(59, 130, 246, 0.3)",
  //           "rgba(229, 231, 235, 1)",
  //         ],
  //       } : {}}
  //       transition={{ duration: 2, repeat: isStreaming ? Infinity : 0 }}
  //       style={{
  //         border: isStreaming ? "1px solid" : "none",
  //         borderRadius: isStreaming ? "8px" : "0",
  //         padding: isStreaming ? "12px" : "0",
  //       }}
  //     >
  //       <AnimatePresence>
  //         {isStreaming && (
  //           <LiveActivityIndicator
  //             isStreaming={isStreaming}
  //             currentStatus={currentStatus}
  //           />
  //         )}
  //       </AnimatePresence>

  //       <AnimatePresence mode="popLayout">
  //         {finalComponents.map((component, index) => (
  //           <motion.div
  //             key={`${component.type}-${index}`}
  //             initial={{ opacity: 0, y: 10 }}
  //             animate={{ opacity: 1, y: 0 }}
  //             transition={{ duration: 0.3, delay: index * 0.1 }}
  //           >
  //             <ComponentRenderer
  //               component={component}
  //               isStreaming={isStreaming}
  //               animationDelay={index * 0.1}
  //             />
  //           </motion.div>
  //         ))}
  //       </AnimatePresence>
	// 	{/* ✅ Optional text content below if message.content field is populated */}
  //       {shouldShowText && (
  //         <motion.div
  //           initial={{ opacity: 0, y: 6 }}
  //           animate={{ opacity: 1, y: 0 }}
  //           transition={{ duration: 0.3, delay: 0.2 }}
  //           className="pt-2 text-base leading-relaxed"
  //         >
  //           <ReactMarkdown remarkPlugins={[remarkGfm]}>
  //             {textToShow}
  //           </ReactMarkdown>
  //         </motion.div>
  //       )}
  //     </motion.div>
  //   );
  // }

   

  // // If no segments were created from message_component, fall back to content
  // // Fallback: only text if no message component
  // const textOnly = isTypewriter ? displayedText || "" : content;
  // return (
  //   <div className="text-base leading-relaxed">
  //     <ReactMarkdown remarkPlugins={[remarkGfm]}>{textOnly}</ReactMarkdown>
  //   </div>
  // );
}
