"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { useProject } from "@/app/hooks/use-project";
import { createProjectForPrompt } from "@/app/lib/api/project";
import {
  DEFAULT_POST_AUTH_REDIRECT,
  getAutoCreateHandoffIdFromNextPath,
  getAutoCreatePromptFromNextPath,
  sanitizeNextPath,
} from "@/app/lib/util/auth/redirect";
import { createSupabaseClient } from "@/app/lib/util/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();
  const { setCurrentProject } = useProject();
  const nextPath = sanitizeNextPath(
    searchParams.get("next"),
    DEFAULT_POST_AUTH_REDIRECT,
  );
  const autoCreatePrompt = getAutoCreatePromptFromNextPath(nextPath);
  const autoCreateHandoffId = getAutoCreateHandoffIdFromNextPath(nextPath);

  useEffect(() => {
    const processLogin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: session.user,
        }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok && registerData.error === "beta_full") {
        await supabase.auth.signOut();
        router.replace("/beta-full");
        return;
      }

      if (autoCreatePrompt) {
        // React can rerun this effect in dev/remount scenarios. Consume the
        // handoff once so the same landing prompt cannot create two projects.
        if (
          autoCreateHandoffId &&
          sessionStorage.getItem(`cognix:auto-create:${autoCreateHandoffId}`)
        ) {
          return;
        }

        if (autoCreateHandoffId) {
          sessionStorage.setItem(
            `cognix:auto-create:${autoCreateHandoffId}`,
            "consumed",
          );
        }

        const result = await createProjectForPrompt(
          autoCreatePrompt,
          session.user.id,
        );
        setCurrentProject(result.project);
        // Skip /project entirely for landing-page prompt handoffs.
        router.replace(result.buildPath);
        return;
      }

      router.replace(nextPath);
    };

    void processLogin();
  }, [
    autoCreateHandoffId,
    autoCreatePrompt,
    nextPath,
    router,
    setCurrentProject,
    supabase,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      <LoadingOverlay
        text={
          autoCreatePrompt ? "Setting up your project..." : "Logging you in..."
        }
      />
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
