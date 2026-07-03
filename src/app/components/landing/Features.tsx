import React from "react";
import { Database, FileText, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { type LandingStyle } from "./landingStyle";

const features = [
  {
    icon: <FileText className="text-orange-400" size={24} />,
    title: "Planning Mode",
    description:
      "Chat through your idea in Plan Mode while Cognix builds and maintains an iterative Product Requirements Document. Your requirements stay organized, structured, and in context, so nothing gets lost as your product evolves.",
  },
  {
    icon: <Database className="text-amber-400" size={24} />,
    title: "Supabase Integration",
    description:
      "Production-ready database through Supabaes. We handle Supabase project creation, table schema generation, and Row Level Security policies. Even though we manage the database for you, you always have full access to it.",
  },
  {
    icon: <ShieldCheck className="text-orange-300" size={24} />,
    title: "Authentication Ready",
    description:
      "Secure user sign-ups and logins out of the box. Pre-configured auth flows integrated directly into your generated UI.",
  },
  {
    icon: <Search className="text-orange-400" size={24} />,
    title: "SEO Optimized",
    description:
      "Cognix builds your app with server-side rendering and automatically configures metadata, Open Graph tags, sitemap.xml, and robots.txt so your product ranks and loads fast from day one.",
  },
];

interface FeaturesProps {
  styleVariant?: LandingStyle;
}

const Features: React.FC<FeaturesProps> = ({ styleVariant = "swiss" }) => {
  if (styleVariant === "beta") {
    return (
      <section id="features" className="relative bg-background py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              Everything you need to <br />
              <span className="cognix-text">ship your startup</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Stop wrestling with boilerplate. Cognix handles the heavy lifting so you can focus on scaling your business.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-brand-primary/40 hover:bg-muted"
              >
                <div className="mb-6 w-fit rounded-lg border border-border bg-muted p-3 transition-colors group-hover:border-brand-primary/40">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
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
      <section id="features" className="relative border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Capabilities
            </div>
            <div>
              <h2 className="mb-6 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
                Everything you need to <br />
                <span className="cognix-gradient-text">ship your startup</span>
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Stop wrestling with boilerplate. Cognix handles the heavy lifting
                so you can focus on scaling your business.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-white/10 bg-slate-950/55 p-8 shadow-[0_20px_80px_rgba(2,8,23,0.45)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/25 hover:bg-slate-950/72"
              >
                <div className="mb-8 flex items-center justify-between">
                  <div className="w-fit rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors group-hover:border-cyan-300/35">
                    {feature.icon}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="leading-8 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="features"
      className="relative border-t border-border bg-background py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-8 border-b border-border pb-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Capabilities
          </div>
          <div>
            <h2 className="mb-6 text-3xl font-black uppercase tracking-[-0.05em] md:text-5xl">
              Everything you need to <br />
              <span className="cognix-text">ship your startup</span>
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Stop wrestling with boilerplate. Cognix handles the heavy lifting
              so you can focus on scaling your business.
            </p>
          </div>
        </div>

        <div className="grid gap-0 border border-border md:grid-cols-2">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card p-8 transition-all duration-300 hover:bg-muted/60 md:min-h-[260px] [&:not(:nth-child(2n))]:border-r [&:not(:nth-child(2n))]:border-border [&:nth-child(-n+2)]:border-b [&:nth-child(-n+2)]:border-border"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="w-fit border border-border bg-muted p-3 transition-colors group-hover:border-brand-primary/40">
                  {feature.icon}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  0{index + 1}
                </div>
              </div>
              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="leading-8 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
