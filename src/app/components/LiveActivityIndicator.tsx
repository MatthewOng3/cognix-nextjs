"use client";

import { motion } from "framer-motion";

const statusTextMap = {
  idle: "Processing your request",
  planning: "Planning your request",
  thinking: "Thinking through the implementation",
  coding: "Writing the changes",
  building: "Building your application",
  deploying: "Deploying your changes",
  pushing_migration: "Pushing the database migration",
  generating_tasks: "Generating the implementation plan",
} as const;

const statusStepLabelMap = {
  thinking: "Think",
  coding: "Write",
  building: "Build",
  deploying: "Deploy",
} as const;

export const streamingStatusOrder = [
  "thinking",
  "coding",
  "building",
  "deploying",
] as const;

type StreamingStatusKey = keyof typeof statusTextMap;

export function getStreamingStatusLabel(status: string) {
  return statusTextMap[status as StreamingStatusKey] ?? statusTextMap.idle;
}

interface LiveActivityIndicatorProps {
  isStreaming: boolean;
  currentStatus: string;
}

interface StreamingStatusRailProps {
  currentStatus: string;
  className?: string;
}

function StepDot({ active, complete }: { active: boolean; complete: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full transition-all ${
        complete
          ? "bg-emerald-400"
          : active
            ? "bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.75)]"
            : "bg-white/15"
      }`}
    />
  );
}

export function StreamingStatusRail({
  currentStatus,
  className = "",
}: StreamingStatusRailProps) {
  const activeIndex = streamingStatusOrder.indexOf(
    currentStatus as (typeof streamingStatusOrder)[number],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(17,24,39,0.84))] px-4 py-3 text-white shadow-[0_12px_40px_rgba(2,6,23,0.28)] backdrop-blur-xl ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10">
            <motion.span
              className="absolute h-4 w-4 rounded-full border border-sky-300/40"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.85)]" />
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
              Live activity
            </p>
            <p className="text-sm font-medium text-white">
              {getStreamingStatusLabel(currentStatus)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {streamingStatusOrder.map((status, index) => {
            const isActive = status === currentStatus;
            const isComplete = activeIndex > index;

            return (
              <div key={status} className="flex items-center gap-2">
                <StepDot active={isActive} complete={isComplete} />
                <span
                  className={`text-xs ${
                    isActive ? "text-white" : "text-white/45"
                  }`}
                >
                  {statusStepLabelMap[status]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function LiveActivityIndicator({
  isStreaming,
  currentStatus,
}: LiveActivityIndicatorProps) {
  if (!isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
      className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-400/8 px-3 py-1.5 text-sm text-sky-100 backdrop-blur-sm"
    >
      <motion.span
        className="h-2 w-2 rounded-full bg-sky-300"
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <span className="font-medium">
        {getStreamingStatusLabel(currentStatus)}
      </span>
    </motion.div>
  );
}
