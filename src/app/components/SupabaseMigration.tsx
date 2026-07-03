import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";

interface SupabaseMigrationProps {
  status: "pushing" | "success" | "failed";
  message?: string;
  error?: string;
}

export function SupabaseMigration({
  status,
  message,
  error,
}: SupabaseMigrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4 w-full max-w-full",
        status === "pushing" && "border-purple-200 bg-purple-50",
        status === "success" && "border-green-200 bg-green-50",
        status === "failed" && "border-red-200 bg-red-50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">
          {status === "pushing" && (
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
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
            <Database
              className={cn(
                "h-4 w-4",
                status === "pushing" && "text-purple-600",
                status === "success" && "text-green-600",
                status === "failed" && "text-red-600"
              )}
            />
            <span
              className={cn(
                "font-medium break-words overflow-wrap-anywhere",
                status === "pushing" && "text-purple-900",
                status === "success" && "text-green-900",
                status === "failed" && "text-red-900"
              )}
            >
              {status === "pushing" && "Pushing Supabase migration..."}
              {status === "success" && "Migration pushed successfully!"}
              {status === "failed" && "Migration failed"}
            </span>
          </div>

          {/* Message */}
          {message && (
            <p
              className={cn(
                "text-sm break-words overflow-wrap-anywhere",
                status === "pushing" && "text-purple-800",
                status === "success" && "text-green-800",
                status === "failed" && "text-red-800"
              )}
            >
              {message}
            </p>
          )}

          {/* Error Details */}
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
        </div>
      </div>
    </motion.div>
  );
}
