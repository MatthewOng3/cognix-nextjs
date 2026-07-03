import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { type LandingStyle } from "./landingStyle";

interface PricingProps {
  styleVariant?: LandingStyle;
}

export default function Pricing({ styleVariant = "swiss" }: PricingProps) {
  const features = [
    "$15 USD Free AI Build Credits",
    "Supabase Project Integration",
    "Simple Deployment",
    "Priority Support",
  ];

  if (styleVariant === "beta") {
    return (
      <section id="pricing" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Pricing
            </p>
            <h2 className="mb-5 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
              Currently in private beta. Join now to lock in free access to all
              premium features and build your SaaS for free.
            </p>
          </div>

          <div className="mx-auto max-w-sm">
            <div
              className="relative flex flex-col rounded-2xl border border-border bg-card p-8"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
              }}
            >
              <div className="mb-8 inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-muted px-2.5 py-1">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary"
                  style={{ boxShadow: "0 0 6px var(--brand-primary, #22c55e)" }}
                />
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                  Beta Free Access
                </span>
              </div>

              <div className="mb-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Early Adopter
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-bold leading-none tracking-tight text-foreground">
                    $0
                  </span>
                </div>
              </div>

              <div className="mb-8 h-px bg-border" />

              <ul className="mb-8 flex-1 space-y-3.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check
                      size={14}
                      strokeWidth={2.5}
                      className="shrink-0 text-brand-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#CTA"
                className="group flex w-full items-center justify-between rounded-xl bg-foreground px-5 py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <span>Get Free Access</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (styleVariant === "space") {
    return (
      <section id="pricing" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Pricing
            </div>
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Pricing
              </p>
              <h2 className="mb-5 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="max-w-xl text-base leading-8 text-slate-300">
                Currently in private beta. Join now to lock in free access to all
                premium features and build your SaaS for free.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-sm">
            <div className="relative flex flex-col rounded-[28px] border border-white/10 bg-slate-950/60 p-8 shadow-[0_30px_100px_rgba(2,8,23,0.65)] backdrop-blur-2xl">
              <div className="mb-8 inline-flex items-center gap-1.5 self-start rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1.5">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"
                  style={{ boxShadow: "0 0 10px rgba(103,232,249,0.9)" }}
                />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                  Beta Free Access
                </span>
              </div>

              <div className="mb-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Early Adopter
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black leading-none tracking-[-0.05em] text-white">
                    $0
                  </span>
                </div>
              </div>

              <div className="mb-8 h-px bg-white/10" />

              <ul className="mb-8 flex-1 space-y-3.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check
                      size={14}
                      strokeWidth={2.5}
                      className="shrink-0 text-cyan-300"
                    />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#CTA"
                className="group flex w-full items-center justify-between rounded-full border border-cyan-300/40 bg-linear-to-r from-cyan-400 to-blue-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:opacity-95 active:scale-[0.98]"
              >
                <span>Get Free Access</span>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>

              <p className="mt-4 text-center text-xs text-slate-400">
                No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-8 border-b border-border pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Pricing
          </div>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Pricing
            </p>
            <h2 className="mb-5 text-3xl font-black uppercase tracking-[-0.05em] text-foreground md:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="max-w-xl text-base leading-8 text-muted-foreground">
              Currently in private beta. Join now to lock in free access to all
              premium features and build your SaaS for free.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-sm">
          <div
            className="relative flex flex-col border border-border bg-card p-8"
            style={{ boxShadow: "18px 18px 0 rgba(249,115,22,0.12)" }}
          >
            <div className="mb-8 inline-flex items-center gap-1.5 self-start border border-border bg-muted px-3 py-1.5">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary"
                style={{ boxShadow: "0 0 6px var(--brand-primary, #22c55e)" }}
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Beta Free Access
              </span>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Early Adopter
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black leading-none tracking-[-0.05em] text-foreground">
                  $0
                </span>
              </div>
            </div>

            <div className="mb-8 h-px bg-border" />

            <ul className="mb-8 flex-1 space-y-3.5">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-brand-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href="#CTA"
              className="group flex w-full items-center justify-between border border-foreground bg-foreground px-5 py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <span>Get Free Access</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
