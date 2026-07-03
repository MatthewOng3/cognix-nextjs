import React from "react";
import { Clock, MessageCircle } from "lucide-react";
import { type LandingStyle } from "./landingStyle";

const supportCards = [
  {
    icon: <MessageCircle className="text-orange-400" size={28} />,
    title: "Real Human Support",
    description:
      "Talk to a real person who understands your project and your context. No bots, just thoughtful, personal help when you need it.",
  },
  {
    icon: <Clock className="text-orange-400" size={28} />,
    title: "Priority Response",
    description:
      "Beta builders get priority support. If you reach out, we will respond quickly so your momentum does not die in the backlog.",
  },
];

interface SupportPromiseProps {
  styleVariant?: LandingStyle;
}

export default function SupportPromise({
  styleVariant = "swiss",
}: SupportPromiseProps) {
  if (styleVariant === "beta") {
    return (
      <section id="support" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-5xl">
              Human, Priority Support
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Building is hard. Getting help shouldn&apos;t be. We support you like a partnerâ€”and we
              back it with a simple promise.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {supportCards.map((card) => (
              <div
                key={card.title}
                className="group relative rounded-2xl border border-border bg-card p-8 shadow-[0_25px_70px_rgba(3,3,10,0.12)] transition-all duration-300 hover:border-brand-primary/40"
              >
                <div className="mb-6 w-fit rounded-xl border border-brand-border bg-brand-primary/10 p-3 transition-colors group-hover:border-brand-primary/40">
                  {card.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (styleVariant === "space") {
    return (
      <section id="support" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Support
            </div>
            <div>
              <h2 className="mb-6 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                Human, Priority Support
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Building is hard. Getting help shouldn&apos;t be. We support you
                like a partnerâ€”and we back it with a simple promise.
              </p>
            </div>
          </div>

          <div className="grid max-w-5xl gap-5 md:mx-auto md:grid-cols-2">
            {supportCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/10 bg-slate-950/55 p-8 backdrop-blur-xl"
              >
                <div className="mb-8 w-fit rounded-2xl border border-white/10 bg-white/5 p-3">
                  {card.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{card.title}</h3>
                <p className="leading-8 text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="support" className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-8 border-b border-border pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Support
          </div>
          <div>
            <h2 className="mb-6 text-3xl font-black uppercase tracking-[-0.05em] text-foreground md:text-5xl">
              Human, Priority Support
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Building is hard. Getting help shouldn&apos;t be. We support you
              like a lifelong partner.
            </p>
          </div>
        </div>

        <div className="grid max-w-5xl gap-0 border border-border md:mx-auto md:grid-cols-2">
          {supportCards.map((card, index) => (
            <div
              key={card.title}
              className="group relative bg-card p-8 transition-all duration-300 hover:bg-muted/50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="w-fit border border-brand-border bg-brand-primary/10 p-3 transition-colors group-hover:border-brand-primary/40">
                  {card.icon}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  0{index + 1}
                </div>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {card.title}
              </h3>
              <p className="leading-8 text-muted-foreground">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
