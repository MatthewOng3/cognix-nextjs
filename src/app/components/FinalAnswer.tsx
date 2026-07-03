// components/FinalAnswer.tsx

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FinalAnswerProps {
  content: string;
  agent?: string;
  isStreaming?: boolean;
  animationDelay?: number;
}

export function FinalAnswer({
  content,
  agent = "AI",
  isStreaming = false,
  animationDelay = 0,
}: FinalAnswerProps) {
  const getAgentLabel = (agent: string) => {
    const labels: Record<string, string> = {
      research: "Research Complete",
      task_planner: "Planning Complete",
      coder: "Implementation Complete",
      unknown: "Step Complete",
    };
    return labels[agent] || "Complete";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className="rounded-lg border border-green-500/20 bg-green-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        </div>
        
        <div className="flex-1 space-y-2">
          {agent !== "unknown" && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-green-500" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {getAgentLabel(agent)}
              </span>
            </div>
          )}
          
          <div className="text-sm leading-relaxed text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}