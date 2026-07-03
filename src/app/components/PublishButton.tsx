"use client";

import { useState, useRef, useEffect } from "react";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  Copy,
  MessageSquarePlus,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { formatRelativeTimeShort } from "../lib/util/functions/date";
import { ApiResponse } from "../lib/util/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PublishStatus = "idle" | "publishing" | "success" | "error";

interface PublishState {
  status: PublishStatus;
  lastPublishedAt: string | null;
  errorMessage: string | null;
  deployedUrl: string | null;
}

interface PublishButtonProps {
  projectId: string;
  chatSessionId: string;
  initialLastPublishedAt?: string | null;
  initialDeployedUrl?: string | null;
  /** Called when user clicks "Ask AI to fix" */
  onSendErrorToChat?: (errorMessage: string) => void;
  /** Override the publish API call – defaults to POST /api/publish */
  //onPublish?: () => Promise<{ url?: string; error?: string }>;
  className?: string;
}

/**
 * @description Deploy user application to a production build
 * @param onSendErrorToChat Function to send error message to AI to fix 
 */
export function PublishButton({
  projectId,
  chatSessionId,
  initialLastPublishedAt,
  initialDeployedUrl,
  onSendErrorToChat,
  className = "",
}: PublishButtonProps) {
	const [state, setState] = useState<PublishState>({
		status: "idle",
		lastPublishedAt: initialLastPublishedAt ?? null,
		errorMessage: null,
		deployedUrl: initialDeployedUrl ?? null,
	});
	 
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	//   const [, forceUpdate] = useState(0);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
		if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
			setDropdownOpen(false);
		}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const [relativeTime, setRelativeTime] = useState<string>("");

	useEffect(() => {
		if (!state.lastPublishedAt) return;
	
		setRelativeTime(formatRelativeTimeShort(state.lastPublishedAt)); // ← already accepts string
	
		const t = setInterval(() => {
		setRelativeTime(formatRelativeTimeShort(state.lastPublishedAt!));
		}, 30_000);
	
		return () => clearInterval(t);
	}, [state.lastPublishedAt]);

	// ── Publish handler ──────────────────────────────────────────────────────────
	async function handlePublish() {
		setState((s) => ({ ...s, status: "publishing", errorMessage: null }));
		setDropdownOpen(false);
		try {
			let result: ApiResponse<{url: string | null, last_deployed_at: string | null}>
			
			const res = await fetch(`/api/deploy`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ projectId, chatSessionId }),
			});
			result = await res.json();
			if (!res.ok && !result.error) result.error = `HTTP ${res.status}`;
			console.log("RESULT", result)
			if (result.error) {
				setState({ status: "error", lastPublishedAt: null, errorMessage: result.error, deployedUrl: null });
			} else {
				setState({ status: "success", lastPublishedAt: result.data?.last_deployed_at ?? null, errorMessage: null, deployedUrl: result.data?.url ?? null });
			}
		} catch (err: any) {
			setState({ status: "error", lastPublishedAt: null, errorMessage: err?.message ?? "Unknown error occurred", deployedUrl: null });
		}
	}

	function handleCopyError() {
		if (!state.errorMessage) return;
		navigator.clipboard.writeText(state.errorMessage);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	/**
	 * @description Craft error prompt to send to AI
	 */
	function handleSendErrorToChat() {
		if (!state.errorMessage || !onSendErrorToChat) return;
		onSendErrorToChat(
		`I got a deployment error. Can you help me fix it?\n\n\`\`\`\n${state.errorMessage}\n\`\`\``
		);
		setDropdownOpen(false);
	}

	const isPublishing = state.status === "publishing";
	const isSuccess = state.status === "success";
	const isError = state.status === "error";

	// ── Status-driven styles — all use CSS vars so light/dark flips automatically ──
	const groupStyle: React.CSSProperties = isError
		? {
			borderColor: "color-mix(in srgb, var(--destructive) 50%, transparent)",
			background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
		}
		: isSuccess
		? {
			borderColor: "color-mix(in srgb, var(--signal-500) 50%, transparent)",
			background: "color-mix(in srgb, var(--signal-500) 10%, transparent)",
		}
		: {
			borderColor: "var(--border)",
			background: "var(--surface-raised)",
		};

	const labelColor = isError
		? "var(--destructive)"
		: isSuccess
		? "var(--signal-700)"
		: "var(--secondary-foreground)";

	const subTextColor = isSuccess ? "var(--signal-600)" : "var(--muted-foreground)";

	const dividerBg = isError
		? "color-mix(in srgb, var(--destructive) 35%, transparent)"
		: isSuccess
		? "color-mix(in srgb, var(--signal-500) 35%, transparent)"
		: "var(--border)";

	const chevronColor = isError
		? "color-mix(in srgb, var(--destructive) 70%, transparent)"
		: isSuccess
		? "var(--signal-600)"
		: "var(--muted-foreground)";

	const DeploymentInfo = () => {
		console.log(state)
		if (!state.lastPublishedAt && !state.deployedUrl) return null;
	  
		return (
		  <div className="space-y-2">
			{state.lastPublishedAt && (
			  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
				<Clock className="w-3 h-3" />
				<span>Last deployed {relativeTime}</span>
			  </div>
			)}
	  
			{state.deployedUrl && (
			  <div
				className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
				style={{
				  background: "color-mix(in srgb, var(--foreground) 5%, transparent)",
				  border: "1px solid var(--border)",
				  color: "var(--foreground)",
				}}
			  >
				<span className="truncate flex-1">{state.deployedUrl}</span>
				<a
				  href={state.deployedUrl}
				  target="_blank"
				  rel="noopener noreferrer"
				  className="shrink-0 transition-opacity hover:opacity-70"
				>
				  <ExternalLink className="w-3.5 h-3.5" />
				</a>
			  </div>
			)}
		  </div>
		);
	  };
	console.log(state.status)
  return (
    <div ref={dropdownRef} className={`relative flex items-center ${className}`}>

      {/* ── Main split-button ─────────────────────────────────── */}
      <div
        className="flex items-center rounded-lg overflow-hidden border transition-colors duration-200"
        style={groupStyle}
      >
        {/* Left: publish trigger */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium transition-all duration-150
                     disabled:opacity-60 disabled:cursor-not-allowed
                     hover:bg-foreground/4 cursor-pointer"
          style={{ color: labelColor }}
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isError ? (
            <XCircle className="w-3.5 h-3.5" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}

          <span>
            {isPublishing ? "Publishing…" : isError ? "Failed" : isSuccess ? "Published" : "Publish"}
          </span>

          {isSuccess && state.lastPublishedAt && (
            <span className="text-xs font-normal hidden sm:inline" style={{ color: subTextColor, opacity: 0.8 }}>
              · {relativeTime}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="self-stretch w-px" style={{ background: dividerBg }} />

        {/* Right: chevron to open panel */}
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center justify-center px-2 py-1.5 hover:bg-foreground/4 transition-colors cursor-pointer"
          style={{ color: chevronColor }}
        >
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {/* ── Dropdown panel ────────────────────────────────────────── */}
      {dropdownOpen && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-72 rounded-xl border overflow-hidden"
          style={{
            background: "var(--popover)",
            borderColor: "var(--border)",
            color: "var(--popover-foreground)",
            boxShadow: "0 16px 40px color-mix(in srgb, var(--foreground) 10%, transparent), 0 0 0 1px var(--border)",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
              Deployment
            </p>
          </div>

          {/* ── Idle ───────────────────────────────────────────────── */}
          {state.status === "idle" && (
            <div className="p-4 space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Publish your app to make it publicly accessible.
              </p>

			  {/* 👇 Show existing deployment if present */}
			<DeploymentInfo />

              <button
                onClick={handlePublish}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer hover:opacity-90"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                <Rocket className="w-3.5 h-3.5" />
                Publish now
              </button>
            </div>
          )}

          {/* ── Publishing ─────────────────────────────────────────── */}
          {state.status === "publishing" && (
            <div className="p-4 flex flex-col items-center gap-3 py-6">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "color-mix(in srgb, var(--brand-primary) 25%, transparent)",
                    borderTopColor: "var(--brand-primary)",
                  }}
                />
                <Rocket className="w-4 h-4 absolute inset-0 m-auto" style={{ color: "var(--brand-primary)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Deploying your app…
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  This usually takes 30–60 seconds
                </p>
              </div>
            </div>
          )}

          {/* ── Success ────────────────────────────────────────────── */}
          {state.status === "success" && (
			<div className="p-4 space-y-4">
				<div className="flex items-start gap-3">
				<div
					className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
					style={{ background: "color-mix(in srgb, var(--signal-500) 15%, transparent)" }}
				>
					<CheckCircle2 className="w-4 h-4" style={{ color: "var(--signal-600)" }} />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
					Deployment successful
					</p>
				</div>
				</div>

				{/* 👇 Reuse same UI */}
				<DeploymentInfo />

				<button
				onClick={handlePublish}
				className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-foreground/[0.03]"
				style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
				>
				<RefreshCw className="w-3 h-3" />
				Re-deploy
				</button>
			</div>
			)}

          {/* ── Error ──────────────────────────────────────────────── */}
          {state.status === "error" && (
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "color-mix(in srgb, var(--destructive) 12%, transparent)" }}
                >
                  <XCircle className="w-4 h-4" style={{ color: "var(--destructive)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    Deployment failed
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Fix the errors below and try again
                  </p>
                </div>
              </div>

              {state.errorMessage && (
                <div
                  className="rounded-lg p-3 text-xs font-mono leading-relaxed max-h-32 overflow-auto"
                  style={{
                    background: "color-mix(in srgb, var(--destructive) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--destructive) 25%, transparent)",
                    // destructive-foreground is very light (#fef2f2) which reads poorly on light bg,
                    // so we use the destructive color itself (red) which works on both themes.
                    color: "var(--destructive)",
                  }}
                >
                  {state.errorMessage}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {onSendErrorToChat && (
                  <button
                    onClick={handleSendErrorToChat}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer hover:opacity-90"
                    style={{
                      background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--brand-primary) 35%, transparent)",
                      color: "var(--brand-muted-foreground)",
                    }}
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Ask AI to fix
                  </button>
                )}
                <button
                  onClick={handleCopyError}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{
                    background: copied
                      ? "color-mix(in srgb, var(--signal-500) 10%, transparent)"
                      : "var(--secondary)",
                    border: `1px solid ${copied
                      ? "color-mix(in srgb, var(--signal-500) 30%, transparent)"
                      : "var(--border)"}`,
                    color: copied ? "var(--signal-700)" : "var(--muted-foreground)",
                  }}
                >
                  {copied ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" />Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" />Copy error</>
                  )}
                </button>
              </div>

              <button
                onClick={handlePublish}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:bg-foreground/[0.03]"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <RefreshCw className="w-3 h-3" />
                Retry deployment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}