import Link from "next/link";
import EmailForm from "@/app/components/landing/EmailForm";

export const metadata = {
  title: "Beta Full — Cognix",
  description:
    "The current beta round is full. Join the waitlist to get access to the next round.",
};

export default function BetaFullPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card text-foreground flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/12 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/12 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center flex flex-col items-center gap-8 rounded-3xl border border-border bg-card/85 backdrop-blur-xl shadow-2xl px-8 py-12">
        {/* Status badge */}
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.18)]">
          <span className="flex h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-100 tracking-wide uppercase">
            Beta Round Full
          </span>
        </div> */}

        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
          We&apos;re at{" "}
          <span className="text-amber-700 dark:text-amber-300">
            Full Capacity
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
          The current beta round has reached its limit. Join the waitlist and
          we&apos;ll notify you as soon as a new round opens up.
        </p>

        {/* Waitlist form */}
        <div className="w-full max-w-md">
          <EmailForm variant="footer" />
        </div>

        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
