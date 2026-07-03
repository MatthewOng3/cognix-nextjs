"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { LoadingOverlay } from "../components/loading-overlay";
import { ProjectPromptComposer } from "../components/project/ProjectPromptComposer";
import { UserDropdown } from "../components/UserDropdown";
import { useAuth } from "../hooks/use-auth";
import { useProject } from "../hooks/use-project";
import {
  createProjectForPrompt,
  ProjectCreationError,
} from "../lib/api/project";
import {
  appendNextParam,
  buildAutoCreateNextPath,
} from "../lib/util/auth/redirect";
import { createSupabaseClient } from "../lib/util/supabase/client";

const featureHighlights = [
  {
    id: "supabase",
    emoji: "⚡",
    title: "Supabase Integration",
    description:
      "Connect Supabase for quick setup of database, auth, and storage. AI manages setup while you keep full control.",
  },
  {
    id: "planner",
    emoji: "🤖",
    title: "Plan mode",
    description:
      "Collaborate with AI to map out features, flows, and requirements. Generate a clear product blueprint before you start building.",
  },
  {
    id: "preview",
    emoji: "🚀",
    title: "Live Preview",
    description:
      "See your app come to life in real-time as you build. Share it with others to get feedback.",
  },
];

/**
 * @description Project creation page with chat-based interface to kick off builder chat and project creation
 * @route /project
 * @returns
 */
function ProjectPageContent() {
  const [projectPrompt, setProjectPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const autoCreateStartedRef = useRef(false);

  const { user, userId, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentProject } = useProject();
  const supabase = createSupabaseClient();

  const handleCreateProjectFromPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      setIsCreating(true);

      try {
        const result = await createProjectForPrompt(prompt, userId);
        setCurrentProject(result.project);
        router.replace(result.buildPath);
      } catch (error) {
        if (error instanceof ProjectCreationError && error.status === 401) {
          const nextPath = buildAutoCreateNextPath(prompt);
          router.push(appendNextParam("/auth/login", nextPath));
          return;
        }

        console.error("Error creating project:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [router, setCurrentProject, userId],
  );

  /**
   * @description Handles project creation with the user's prompt
   */
  async function handleCreateProject() {
    if (!projectPrompt.trim()) return;

    if (!userId) {
      const nextPath = buildAutoCreateNextPath(projectPrompt);
      router.push(appendNextParam("/auth/register", nextPath));
      return;
    }

    await handleCreateProjectFromPrompt(projectPrompt);
  }

  /**
   * @description Logout functionality
   */
  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error Signing Out", error);
    } else {
      router.replace("/auth/login");
    }
  }

  useEffect(() => {
    const promptFromQuery = searchParams.get("prompt") ?? "";
    const shouldAutoCreate = searchParams.get("autoCreate") === "1";

    if (promptFromQuery && !projectPrompt) {
      setProjectPrompt(promptFromQuery);
    }

    if (
      !loading &&
      userId &&
      shouldAutoCreate &&
      promptFromQuery &&
      !autoCreateStartedRef.current
    ) {
      autoCreateStartedRef.current = true;
      setProjectPrompt(promptFromQuery);
      void handleCreateProjectFromPrompt(promptFromQuery);
    }
  }, [
    handleCreateProjectFromPrompt,
    loading,
    projectPrompt,
    searchParams,
    userId,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold cognix-text">Cognix Studio</h1>
          </div>

          <div className="flex items-center gap-4">
            <UserDropdown user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-4xl mx-auto">
          <ProjectPromptComposer
            projectPrompt={projectPrompt}
            onProjectPromptChange={setProjectPrompt}
            onSubmit={handleCreateProject}
            isSubmitting={isCreating}
            title="What will you build today?"
            description="Describe your app idea and watch as AI brings it to life. From concept to deployment in minutes."
          />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureHighlights.map((feature) => (
              <div
                key={feature.id}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border hover:border-orange-500/30 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{feature.emoji}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {isCreating && <LoadingOverlay text="Setting up your project..." />}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProjectPageContent />
    </Suspense>
  );
}
