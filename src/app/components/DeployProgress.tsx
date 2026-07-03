"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Rocket, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { useChatActions } from "@/app/components/ChatActionsContext";

interface DeployProgressProps {
  status: "deploying" | "success" | "failed";
  message?: string;
  error?: string;
}

export function DeployProgress({
  status,
  message,
  error,
}: DeployProgressProps) {
	const chatActions = useChatActions();
	const [fixing, setFixing] = useState(false);
		
	async function handleFixError() {
		if (!chatActions || !error) return;
		setFixing(true);
		try {
			await chatActions.sendMessage(
				`The code failed with this error, please fix it:\n\`\`\`\n${error}\n\`\`\``,
				true
			);
		} finally {
			setFixing(false);
		}
	}

	return (
		<motion.div
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		className={cn(
			"rounded-lg border p-4 w-full overflow-hidden",
			status === "deploying" && "border-orange-200 bg-orange-50",
			status === "success" && "border-green-200 bg-green-50",
			status === "failed" && "border-red-200 bg-red-50"
		)}
		 
		>
			<div className="flex items-start gap-3">
				{/* Icon */}
				<div className="mt-1">
				{status === "deploying" && (
					<Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
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
					<Rocket
					className={cn(
						"h-4 w-4",
						status === "deploying" && "text-orange-600",
						status === "success" && "text-green-600",
						status === "failed" && "text-red-600"
					)}
					/>
					<span
					className={cn(
						"font-medium wrap-break-word overflow-wrap-anywhere",
						status === "deploying" && "text-orange-900",
						status === "success" && "text-green-900",
						status === "failed" && "text-red-900"
					)}
					>
					{status === "deploying" && "Updating your application preview..."}
					{status === "success" && "Preview Updated Successfully!"}
					{status === "failed" && "Preview Update Failed"}
					</span>
				</div>

				{/* Message */}
				{message && status === "failed" &&(
					<p
					className={cn(
						"text-sm wrap-break-word overflow-wrap-anywhere text-red-800"
						// status === "deploying" && "text-orange-800",
						// status === "success" && "text-green-800",
						// status === "failed" && "text-red-800"
					)}
					>
					{message}
					</p>
				)}

				{/* Error Details */}
				{status === "failed" && error && (
				<details className="mt-2 w-full overflow-hidden">
					<summary className="text-sm text-red-700 cursor-pointer hover:text-red-900">
					View error details
					</summary>
					<div className="w-full overflow-hidden">
					<pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-900 max-h-40 overflow-auto whitespace-pre-wrap break-all w-full">
						{error}
					</pre>
					</div>
				</details>
				)}

				{/* Fix Error Button */}
				{status === "failed" && error && chatActions && (
					<button
					onClick={handleFixError}
					disabled={fixing}
					className={cn(
						"mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
						"bg-red-600 text-white hover:bg-red-700",
						"disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
					)}
					>
					{fixing ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Wrench className="h-4 w-4" />
					)}
					{fixing ? "Sending to AI..." : "Fix this error"}
					</button>
				)}
				</div>
			</div>
		</motion.div>
	);
}
