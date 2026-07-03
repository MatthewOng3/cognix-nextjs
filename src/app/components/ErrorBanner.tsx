import { AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-2 my-1">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-red-800 font-medium text-base leading-relaxed">
            <span className="font-semibold">Error:</span> {message}
          </div>
        </div>
      </div>
    </div>
  );
}
