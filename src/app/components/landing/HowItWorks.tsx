import React from "react";
import Image from "next/image";
import { type LandingStyle } from "./landingStyle";
import Screenshot from "@/../public/how_it_works.png";

const steps = [
  {
    id: "01",
    title: "Describe your Idea",
    text: "Chat with the Planner agent about what you want to build. The AI refines your requirements into a clear product specification.",
  },
  {
    id: "02",
    title: "Watch it Build",
    text: "Cognix agents write the frontend and backend code, connecting your UI to a real Supabase database.",
  },
  {
    id: "03",
    title: "Launch",
    text: "Deploy your product with a click and invite your first users immediately.",
  },
];

interface HowItWorksProps {
  styleVariant?: LandingStyle;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ styleVariant = "swiss" }) => {
  if (styleVariant === "beta") {
    return (
      <section id="how-it-works" className="relative overflow-hidden py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              From Prompt to Product
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              The traditional development cycle takes weeks. Cognix condenses it into minutes using advanced autonomous agents.
            </p>
          </div>

          <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
            <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-orange-500 to-amber-500 opacity-20 blur" />
            <div className="relative flex flex-col overflow-hidden rounded-xl bg-slate-950">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                  <div className="h-3 w-3 rounded-full bg-slate-700" />
                </div>
                <div className="text-xs text-slate-500">Workflow Visualization</div>
              </div>
              <div className="relative w-full">
                <Image
                  src={Screenshot}
                  alt="Cognix AI Screenshot on how the application works"
                  className="h-auto w-full"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-1 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-mono font-bold text-white">
                  {step.id}
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.text}
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
      <section id="how-it-works" className="relative overflow-hidden border-t border-white/10 py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4">
          <div className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Workflow
            </div>
            <div>
              <h2 className="mb-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                From Prompt to Product
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                The traditional development cycle takes weeks. Cognix condenses it
                into minutes using advanced autonomous agents.
              </p>
            </div>
          </div>

          <div className="relative rounded-[30px] border border-white/10 bg-slate-950/60 p-3 shadow-[0_30px_100px_rgba(2,8,23,0.65)] backdrop-blur-2xl">
            <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/70 px-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-300/60" />
                  <div className="h-3 w-3 rounded-full bg-blue-400/40" />
                  <div className="h-3 w-3 rounded-full bg-fuchsia-400/40" />
                </div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Workflow Visualization
                </div>
              </div>
              <div className="relative w-full">
                <Image
                  src={Screenshot}
                  alt="Cognix AI Screenshot on how the application works"
                  className="h-auto w-full"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className="rounded-[28px] border border-white/10 bg-slate-950/55 p-8 backdrop-blur-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Step {step.id}
                  </div>
                  <div className="h-2.5 w-14 rounded-full bg-linear-to-r from-cyan-300 to-blue-500" />
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-8 text-slate-400">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-border py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4">
        <div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Workflow
          </div>
          <div>
            <h2 className="mb-4 text-3xl font-black uppercase tracking-[-0.05em] md:text-5xl">
              From Prompt to Product
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The traditional development cycle takes weeks. Cognix condenses it
              into minutes using advanced autonomous agents.
            </p>
          </div>
        </div>

        <div className="relative border border-border bg-card p-3 shadow-[18px_18px_0px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden border border-slate-800 bg-slate-950">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-700" />
                <div className="h-3 w-3 rounded-full bg-slate-700" />
                <div className="h-3 w-3 rounded-full bg-slate-700" />
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Workflow Visualization
              </div>
            </div>
            <div className="relative w-full">
              <Image
                src={Screenshot}
                alt="Cognix AI Screenshot on how the application works"
                className="h-auto w-full"
                sizes="100vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 border border-border lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col gap-4 bg-card p-8 transition-colors duration-300 hover:bg-muted/50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border lg:[&:not(:last-child)]:border-b-0 lg:[&:not(:last-child)]:border-r"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Step {step.id}
                </div>
                <div className="h-3 w-12 bg-brand-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-8 text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
