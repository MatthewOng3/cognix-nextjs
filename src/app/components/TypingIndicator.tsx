import { motion } from "framer-motion";
import { Code } from "lucide-react";

/**
 * @description Typing indicator component that shows animated dots like in messaging apps
 */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <Code className="w-4 h-4 text-accent-foreground" />
      </div>

      {/* Typing Bubble */}
      <div className="flex-1 flex flex-col items-start">
        <div className="bg-sidebar rounded-lg p-3 px-4">
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        {/* AI Name */}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs font-medium text-foreground">Jarvis</p>
          <p className="text-xs text-muted-foreground">typing...</p>
        </div>
      </div>
    </div>
  );
}