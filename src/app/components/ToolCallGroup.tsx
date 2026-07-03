import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolCallItem } from "@/app/components/ToolCallItem";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible";
import type { ToolCallComponent } from "@/app/lib/util/supabase/types/tables";

interface ToolCallGroupProps {
  toolCalls: ToolCallComponent[];
  isStreaming?: boolean;
}

export function ToolCallGroup({
  toolCalls,
  isStreaming = false,
}: ToolCallGroupProps) {
  const [isOpen, setIsOpen] = useState(isStreaming);
  //console.log("IN TOOL CALL GROUP", toolCalls)
  // Auto-expand when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (toolCalls.length === 0) {
    return null;
  }

  const actionCount = toolCalls.length;

  return (
    <div className="my-2 w-full max-w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50 w-full text-left">
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span>{actionCount} actions taken</span>
        </CollapsibleTrigger>

        <CollapsibleContent className="pl-6 space-y-1 mt-2 w-full max-w-full">
          <AnimatePresence mode="popLayout">
            {toolCalls.map((toolCall, index) => (
              <ToolCallItem
                key={`${toolCall.name}-${index}`}
                toolCall={toolCall}
                isAnimated={isStreaming}
                delay={index * 0.1}
              />
            ))}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
