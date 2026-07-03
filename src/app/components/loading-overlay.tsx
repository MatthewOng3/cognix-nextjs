// Generic loading overlay component
import { Loader2 } from "lucide-react";

export function LoadingOverlay({ text = "Loading...", fullScreen = true, dim = true}: { text?: string, fullScreen?: boolean, dim?: boolean }) {
  const positionClass = fullScreen ? "fixed inset-0" : "absolute inset-0";
  const backdropClass = dim
    ? // slightly different backdrop for scoped vs fullscreen so it looks good inside a card
      fullScreen
      ? "backdrop-blur-sm bg-black/30"
      : "bg-black/40"
    : "bg-transparent";

    return (
      <div
        aria-busy="true"
        role="status"
        className={`${positionClass} z-50 flex items-center justify-center ${backdropClass}`}
      >
        <div className="flex flex-col items-center pointer-events-auto px-4 py-2">
          <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
          <span className="text-lg font-medium text-white drop-shadow">{text}</span>
        </div>
      </div>
    );
}
