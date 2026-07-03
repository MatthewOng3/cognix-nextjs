"use client";

import DOMPurify from "dompurify";
import { ArrowRight, Sparkles } from "lucide-react";
import { type LandingStyle } from "@/app/components/landing/landingStyle";
import { Button } from "@/app/components/ui/button";
import { useTypewriter } from "@/app/hooks/use-typewriter";
import { cn } from "@/app/lib/utils";

const placeholders = [
  "A task management app with real-time collaboration...",
  "An e-commerce store with payment integration...",
  "A social media dashboard with analytics...",
  "A fitness tracking app with workout plans...",
  "A recipe sharing platform with AI suggestions...",
  "A portfolio website with blog functionality...",
  "A booking system for appointments...",
  "A chat application with video calls...",
  "An inventory management system...",
  "A learning platform with course creation...",
];

type ProjectPromptComposerProps = {
  projectPrompt: string;
  onProjectPromptChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  title: string;
  description: string;
  badgeLabel?: string;
  styleVariant?: LandingStyle;
};

export function ProjectPromptComposer({
  projectPrompt,
  onProjectPromptChange,
  onSubmit,
  isSubmitting,
  title,
  description,
  badgeLabel = "AI-Powered Development",
  styleVariant = "swiss",
}: ProjectPromptComposerProps) {
  const { displayText: typedPlaceholder, currentIndex: placeholderIndex } =
    useTypewriter(placeholders);

  const isSwiss = styleVariant === "swiss";
  const isSpace = styleVariant === "space";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={cn("text-center", isSwiss ? "mb-10 space-y-5" : "mb-12 space-y-4")}>
        <div
          className={cn(
            "inline-flex items-center gap-2",
            isSwiss
              ? "mb-6 border border-brand-primary/40 bg-background px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-foreground shadow-[8px_8px_0px_rgba(249,115,22,0.14)]"
              : isSpace
                ? "mb-6 rounded-full border border-cyan-300/30 bg-slate-950/70 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_60px_rgba(34,211,238,0.12)] backdrop-blur-xl"
              : "mb-6 rounded-full border border-orange-500/30 bg-linear-to-r from-orange-500/20 to-amber-500/20 px-4 py-2",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4",
              isSwiss
                ? "text-brand-primary"
                : isSpace
                  ? "text-cyan-300"
                  : "text-orange-400",
            )}
          />
          <span className={cn(isSwiss ? "" : "text-sm font-medium")}>
            {badgeLabel}
          </span>
        </div>

        <h1
          className={cn(
            "text-foreground",
            isSwiss
              ? "mx-auto max-w-4xl text-5xl font-black uppercase tracking-[-0.05em] md:text-7xl"
              : isSpace
                ? "mx-auto max-w-4xl text-5xl font-black tracking-[-0.05em] text-white md:text-7xl"
              : "mb-4 text-5xl font-bold md:text-6xl",
          )}
        >
          {title}
        </h1>

        <p
          className={cn(
            "mx-auto max-w-2xl text-muted-foreground",
            isSwiss
              ? "text-base leading-8 md:text-lg"
              : isSpace
                ? "text-base leading-8 text-slate-300 md:text-lg"
                : "text-xl",
          )}
        >
          {description}
        </p>
      </div>

      <div className="relative">
        {isSwiss ? (
          <div className="absolute -left-4 top-5 hidden h-[calc(100%-1.5rem)] w-4 border-y border-l border-brand-primary/40 md:block" />
        ) : isSpace ? (
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-linear-to-r from-cyan-400/15 via-transparent to-fuchsia-500/15 blur-2xl" />
        ) : null}

        <div
          className={cn(
            "transition-all duration-300",
            isSwiss
              ? "border border-border bg-card p-3 shadow-[18px_18px_0px_rgba(15,23,42,0.08)] hover:border-brand-primary/50 focus-within:border-brand-primary"
              : isSpace
                ? "rounded-[28px] border border-white/10 bg-slate-950/70 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_28px_100px_rgba(2,8,23,0.7)] backdrop-blur-2xl hover:border-cyan-300/35 focus-within:border-cyan-300/55"
              : "rounded-2xl border-2 border-border bg-card/80 p-2 shadow-2xl backdrop-blur-xl hover:border-orange-500/50 focus-within:border-orange-500 focus-within:shadow-orange-500/20",
          )}
        >
          {isSwiss ? (
            <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <span className="inline-block h-2.5 w-2.5 bg-brand-primary" />
                Start with any prompt
              </div>
              <div className="hidden text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground md:block">
                Shift+Enter for new line
              </div>
            </div>
          ) : isSpace ? (
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                Launch sequence
              </div>
              <div className="hidden text-[0.7rem] uppercase tracking-[0.2em] text-slate-500 md:block">
                Prompt • Plan • Build
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              isSwiss
                ? "flex flex-col gap-3 md:flex-row md:items-end"
                : "flex items-end gap-3",
            )}
          >
            <div className="relative flex-1">
              <textarea
                value={projectPrompt}
                onChange={(e) =>
                  onProjectPromptChange(DOMPurify.sanitize(e.target.value))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                placeholder={typedPlaceholder}
                className={cn(
                  "w-full resize-none bg-transparent text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/60",
                  isSwiss
                    ? "min-h-[140px] max-h-[300px] px-2 py-3 text-lg leading-8"
                    : isSpace
                      ? "min-h-[140px] max-h-[300px] px-3 py-3 text-lg leading-8 text-slate-100 placeholder:text-slate-500"
                    : "min-h-[120px] max-h-[300px] px-4 py-4 text-lg",
                )}
                disabled={isSubmitting}
              />

              {!projectPrompt && (
                <div
                  className={cn(
                    "absolute bottom-2 flex gap-1",
                    isSwiss ? "left-2" : "left-4",
                  )}
                >
                  {placeholders.map((placeholder, idx) => (
                    <div
                      key={placeholder}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        idx === placeholderIndex
                          ? isSwiss
                            ? "w-8 bg-brand-primary"
                            : isSpace
                              ? "w-8 bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]"
                            : "w-6 bg-orange-500"
                          : "w-1 bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={onSubmit}
              disabled={!projectPrompt.trim() || isSubmitting}
              className={cn(
                "group cursor-pointer transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
                isSwiss
                  ? "h-11 rounded-none border border-foreground bg-foreground px-5 text-sm font-semibold text-background shadow-[8px_8px_0px_rgba(249,115,22,0.24)] hover:-translate-y-0.5 hover:opacity-95 md:h-[50px] md:min-w-[148px]"
                  : isSpace
                    ? "h-12 rounded-full border border-cyan-300/40 bg-linear-to-r from-cyan-400 to-blue-500 px-6 text-base font-semibold text-slate-950 shadow-[0_20px_60px_rgba(34,211,238,0.3)] hover:-translate-y-0.5 hover:shadow-[0_24px_72px_rgba(59,130,246,0.35)] md:h-[140px] md:min-w-[176px]"
                  : "h-10 rounded-xl bg-accent px-8 text-lg font-semibold text-primary shadow-lg hover:opacity-90 hover:shadow-xl",
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSwiss || isSpace ? <span>Create Project</span> : null}
                  <ArrowRight className="h-5 w-5 cursor-pointer transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 text-center text-sm text-muted-foreground",
            isSwiss ? "md:hidden" : "",
          )}
        >
          <span className="inline-flex items-center gap-2">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
              Enter
            </kbd>{" "}
            to create or{" "}
            <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
              Shift + Enter
            </kbd>{" "}
            for new line
          </span>
        </div>
      </div>
    </div>
  );
}
