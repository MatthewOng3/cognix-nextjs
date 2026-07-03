import React from "react";
import { ArrowRight } from "lucide-react";
import EmailForm from "./EmailForm";
import { type LandingStyle } from "./landingStyle";

interface CTASectionProps {
  betaOpen?: boolean;
  styleVariant?: LandingStyle;
}

const CTASection: React.FC<CTASectionProps> = ({
  betaOpen = false,
  styleVariant = "swiss",
}) => {
  if (styleVariant === "beta") {
    return (
      <section className="bg-card px-6 py-24" id="CTA">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Ready to build your <br />
            <span className="cognix-text">Dream Application?</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
            Join early adopters building their future with Cognix. Get free
            access to the beta today.
          </p>

          <div className="flex justify-center">
            {betaOpen ? (
              <a
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-foreground transition-all hover:bg-accent/80"
              >
                <span>Join the Beta</span>
                <ArrowRight size={20} />
              </a>
            ) : (
              <EmailForm variant="footer" />
            )}
          </div>
        </div>
      </section>
    );
  }

  if (styleVariant === "space") {
    return (
      <section className="border-y border-white/10 px-6 py-24" id="CTA">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-slate-950/60 px-6 py-12 text-center shadow-[0_30px_100px_rgba(2,8,23,0.65)] backdrop-blur-2xl md:px-10">
          <div className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Start now
          </div>
          <h2 className="mb-6 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Ready to build your <br />
            <span className="cognix-gradient-text">Dream Application?</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-8 text-slate-300">
            Join early adopters building their future with Cognix. Get free
            access to the beta today.
          </p>

          <div className="flex justify-center">
            {betaOpen ? (
              <a
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-linear-to-r from-cyan-400 to-blue-500 px-8 py-4 text-lg font-semibold text-slate-950 transition-all hover:opacity-95"
              >
                <span>Join the Beta</span>
                <ArrowRight size={20} />
              </a>
            ) : (
              <EmailForm variant="footer" />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-border bg-card px-6 py-24" id="CTA">
      <div className="mx-auto max-w-5xl border border-border bg-background px-6 py-12 text-center shadow-[18px_18px_0px_rgba(249,115,22,0.12)] md:px-10">
        <div className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Start now
        </div>
        <h2 className="mb-6 text-4xl font-black uppercase tracking-[-0.05em] text-foreground md:text-6xl">
          Ready to build your <br />
          <span className="cognix-text">Dream Application?</span>
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-xl leading-8 text-muted-foreground">
          Join early adopters building their future with Cognix. Get free
          access to the beta today.
        </p>

        <div className="flex justify-center">
          {betaOpen ? (
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-8 py-4 text-lg font-semibold text-background transition-all hover:opacity-90"
            >
              <span>Join the Beta</span>
              <ArrowRight size={20} />
            </a>
          ) : (
            <EmailForm variant="footer" />
          )}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
