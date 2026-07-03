// components/BuildProgress.tsx

import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";

interface BuildProgressProps {
  status: "building" | "success" | "failed";
  message?: string;
  error?: string;
  buildOutput?: string
}

export function BuildProgress({
  status,
  message,
  error,
  buildOutput
}: BuildProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4 w-full max-w-full",
        status === "building" && "border-blue-200 bg-blue-50",
        status === "success" && "border-green-200 bg-green-50",
        status === "failed" && "border-red-200 bg-red-50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">
          {status === "building" && (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          {status === "failed" && (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium break-words overflow-wrap-anywhere",
                status === "building" && "text-blue-900",
                status === "success" && "text-green-900",
                status === "failed" && "text-red-900"
              )}
            >
              {status === "building" && "Building your application..."}
              {status === "success" && "Build successful!"}
              {status === "failed" && "Build failed"}
            </span>
          </div>

          {/* Message */}
          {message && (
            <p
              className={cn(
                "text-sm break-words overflow-wrap-anywhere",
                status === "building" && "text-blue-800",
                status === "success" && "text-green-800",
                status === "failed" && "text-red-800"
              )}
            >
              {message}
            </p>
          )}

          {/* Error Details (collapsible) */}
          {status === "failed" && error && (
            <details className="mt-2 w-full max-w-full">
              <summary className="text-sm text-red-700 cursor-pointer hover:text-red-900">
                View error details
              </summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-900 overflow-x-auto max-h-40 overflow-y-auto w-full max-w-full break-words whitespace-pre-wrap">
                {error}
              </pre>
            </details>
          )}

          {/* Build Output (for success) */}
          {status === "success" && buildOutput && (
            <details className="mt-2 w-full max-w-full">
              <summary className="text-sm text-green-700 cursor-pointer hover:text-green-900">
                View build output
              </summary>
              <pre className="mt-2 p-3 bg-green-100 rounded text-xs text-green-900 overflow-x-auto max-h-40 overflow-y-auto w-full max-w-full break-words whitespace-pre-wrap">
                {buildOutput}
              </pre>
            </details>
          )}
        </div>
      </div>
    </motion.div>
  );
}