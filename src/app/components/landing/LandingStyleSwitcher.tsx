import { cn } from "@/app/lib/utils";
import {
  type LandingStyle,
  getLandingStyleHref,
  landingStyles,
} from "./landingStyle";

const styleLabels: Record<LandingStyle, string> = {
  swiss: "Swiss",
  space: "Space",
  beta: "Beta",
};

interface LandingStyleSwitcherProps {
  activeStyle: LandingStyle;
}

export default function LandingStyleSwitcher({
  activeStyle,
}: LandingStyleSwitcherProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 border border-border bg-background/95 p-2 shadow-lg backdrop-blur md:bottom-6 md:right-6">
      <div className="mb-2 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Landing Style
      </div>
      <div className="flex gap-2">
        {landingStyles.map((style) => (
          <a
            key={style}
            href={getLandingStyleHref(style)}
            className={cn(
              "border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
              activeStyle === style
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground hover:border-brand-primary/40",
            )}
          >
            {styleLabels[style]}
          </a>
        ))}
      </div>
    </div>
  );
}
