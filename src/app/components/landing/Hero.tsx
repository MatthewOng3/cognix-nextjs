"use client";

import { Database, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { ProjectPromptComposer } from "@/app/components/project/ProjectPromptComposer";
import { useAuth } from "@/app/hooks/use-auth";
import { useProject } from "@/app/hooks/use-project";
import {
  createProjectForPrompt,
  ProjectCreationError,
} from "@/app/lib/api/project";
import {
  appendNextParam,
  buildAutoCreateNextPath,
} from "@/app/lib/util/auth/redirect";
import { type LandingStyle } from "./landingStyle";

interface HeroProps {
  betaOpen?: boolean;
  styleVariant?: LandingStyle;
}

const Hero: React.FC<HeroProps> = ({
  betaOpen = false,
  styleVariant = "swiss",
}) => {
  const [projectPrompt, setProjectPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { userId, loading } = useAuth();
  const { setCurrentProject } = useProject();
  const router = useRouter();

  async function handleHeroSubmit() {
    if (!projectPrompt.trim() || loading) return;

    if (!userId) {
      if (!betaOpen) {
        router.push("/beta-full");
        return;
      }

      const nextPath = buildAutoCreateNextPath(projectPrompt);
      router.push(appendNextParam("/auth/register", nextPath));
      return;
    }

    setIsCreating(true);

    try {
      const result = await createProjectForPrompt(projectPrompt, userId);
      setCurrentProject(result.project);
      router.replace(result.buildPath);
    } catch (error) {
      if (error instanceof ProjectCreationError && error.status === 401) {
        const nextPath = buildAutoCreateNextPath(projectPrompt);
        router.push(appendNextParam("/auth/login", nextPath));
        return;
      }

      console.error("Error creating project from landing page:", error);
    } finally {
      setIsCreating(false);
    }
  }

  if (styleVariant === "beta") {
    return (
      <section className="relative px-6 pt-32 pb-20 md:pt-48 md:pb-32" id="Hero">
        {isCreating && <LoadingOverlay text="Setting up your project..." />}
        <div className="mx-auto max-w-7xl">
          <ProjectPromptComposer
            projectPrompt={projectPrompt}
            onProjectPromptChange={setProjectPrompt}
            onSubmit={handleHeroSubmit}
            isSubmitting={isCreating}
            title="The AI Full-Stack App Builder"
            description="Turn your idea into a deployed app in minutes. Start with a prompt and let Cognix handle backend and SEO."
            badgeLabel={betaOpen ? "Private Beta is Live" : "Built for founders"}
            styleVariant={styleVariant}
          />

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Terminal size={16} />
              <span>Full Code Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>Supabase Included</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (styleVariant === "space") {
    return (
      <section
        className="relative overflow-hidden px-6 pb-24 pt-28 md:pb-32 md:pt-44"
        id="Hero"
      >
        {isCreating && <LoadingOverlay text="Setting up your project..." />}
        <div className="pointer-events-none absolute left-[6%] top-24 h-48 w-48 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-40 h-56 w-56 rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-8">
              <div className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                <span className="inline-block h-2.5 w-12 rounded-full bg-linear-to-r from-cyan-300 to-blue-500 shadow-[0_0_14px_rgba(56,189,248,0.7)]" />
                AI systems for product launch
              </div>

              <ProjectPromptComposer
                projectPrompt={projectPrompt}
                onProjectPromptChange={setProjectPrompt}
                onSubmit={handleHeroSubmit}
                isSubmitting={isCreating}
                title="The AI Full-Stack App Builder"
                description="Turn your idea into a deployed app in minutes. Start with a prompt and let Cognix handle backend and SEO."
                badgeLabel={betaOpen ? "Private Beta is Live" : "Built for founders"}
                styleVariant={styleVariant}
              />

              <div className="grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 text-slate-100 backdrop-blur-xl">
                  <Terminal size={18} className="text-cyan-300" />
                  <span className="text-sm font-medium">Full Code Access</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-4 text-slate-100 backdrop-blur-xl">
                  <Database size={18} className="text-cyan-300" />
                  <span className="text-sm font-medium">Supabase Included</span>
                </div>
              </div>
            </div>

            <div className="hidden rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-[0_28px_100px_rgba(2,8,23,0.7)] backdrop-blur-2xl lg:block">
              <div className="mb-10 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Mission control
              </div>
              <div className="space-y-8">
                <div>
                  <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-white">
                    Prompt
                  </div>
                  <p className="text-sm leading-7 text-slate-400">
                    Describe the system you want to launch.
                  </p>
                </div>
                <div>
                  <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-white">
                    Build
                  </div>
                  <p className="text-sm leading-7 text-slate-400">
                    Cognix assembles the stack, data model, and UI.
                  </p>
                </div>
                <div>
                  <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-white">
                    Launch
                  </div>
                  <p className="text-sm leading-7 text-slate-400">
                    Ship a real product, not just a concept demo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden px-6 pb-20 pt-28 md:pb-28 md:pt-44"
      id="Hero"
    >
      {isCreating && <LoadingOverlay text="Setting up your project..." />}
      <div className="pointer-events-none absolute inset-x-0 top-24 h-px bg-linear-to-r from-transparent via-border to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-8 hidden w-px bg-linear-to-b from-transparent via-border to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-8 hidden w-px bg-linear-to-b from-transparent via-border to-transparent lg:block" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <span className="inline-block h-3 w-3 bg-brand-primary" />
              Launch your Product without friction
            </div>

            <ProjectPromptComposer
              projectPrompt={projectPrompt}
              onProjectPromptChange={setProjectPrompt}
              onSubmit={handleHeroSubmit}
              isSubmitting={isCreating}
              title="The AI Full-Stack App Builder"
              description="Turn your idea into a deployed app in minutes. Start with a prompt and let Cognix handle backend and SEO."
              badgeLabel={"Built for founders"}
              styleVariant={styleVariant}
            />

            <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div className="flex items-center gap-3 border border-border bg-card px-4 py-4">
                <Terminal size={18} className="text-brand-primary" />
                <span className="text-sm font-medium text-foreground">
                  Full Code Access
                </span>
              </div>
              <div className="flex items-center gap-3 border border-border bg-card px-4 py-4">
                <Database size={18} className="text-brand-primary" />
                <span className="text-sm font-medium text-foreground">
                  Supabase Included
                </span>
              </div>
            </div>
          </div>

          <div className="hidden border border-border bg-card p-5 lg:block">
            <div className="mb-10 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Why teams switch
            </div>
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-foreground">
                  SEO
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  Build your product with all the tools needed to rank and grow.
                </p>
              </div>
              <div>
                <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-foreground">
                  Plan
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  Keep product decisions structured before build to avoid scope creep.
                </p>
              </div>
              <div>
                <div className="mb-2 text-4xl font-black tracking-[-0.06em] text-foreground">
                  Supabase Backend
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  Production-ready database with Row Level Security and authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
