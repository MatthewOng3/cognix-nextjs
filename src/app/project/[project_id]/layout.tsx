/* eslint-disable */

"use client";

import { useParams, useRouter } from "next/navigation";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/app/components/AlertNotif";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { SupportModal } from "@/app/components/SupportModal";
import { useAuth } from "@/app/hooks/use-auth";
import { usePreviewPresence } from "@/app/hooks/use-preview-presence";
import { useProject } from "@/app/hooks/use-project";
import { useUser } from "@/app/hooks/use-user";
import { AppSidebar } from "../../components/AppSidebar";
import { Header } from "../../components/Header";

/**
 * @description Base parent layout for each project workspace
 * @returns
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { showAlert } = useAlert();
  const { project_id } = useParams<{ project_id: string }>();
  const { userId, loading: authLoading } = useAuth();

  const { activeProject, setFetchLoading, fetchProjectInfo } = useProject();
  const { fetchUserInfo } = useUser();
  const router = useRouter();
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);

  const getProjectData = useCallback(async () => {
    setIsProjectLoading(true);
    setFetchLoading(true);

    try {
      // The API route already enforces project ownership server-side. If this
      // fetch succeeds, the client should trust the result instead of trying to
      // re-check ownership with partial data.
      const result = await fetchProjectInfo(project_id);

      if (!result) {
        showAlert("Project not found", "error");
        setIsRedirecting(true);
        router.replace("/project");
        return;
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      showAlert("Error fetching project data", "error");
      setIsRedirecting(true);
      router.replace("/project");
      return;
    } finally {
      if (!isRedirecting) {
        setIsProjectLoading(false);
      }
    }
  }, [
    fetchProjectInfo,
    isRedirecting,
    project_id,
    router,
    setFetchLoading,
    showAlert,
  ]);

  useEffect(() => {
    if (!authLoading && userId && project_id) {
      void getProjectData();
      void fetchUserInfo();
    }
  }, [authLoading, fetchUserInfo, getProjectData, project_id, userId]);

  usePreviewPresence(
    project_id ?? null,
    !!userId && !!activeProject && !isProjectLoading && !isRedirecting,
  );

  if (authLoading || isProjectLoading || isRedirecting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex w-full">
      <main className="flex-1 flex flex-col min-h-0 bg-navbar">
        <Header />
        {isProjectLoading && <LoadingOverlay text="Loading Project..." />}
        <div className="flex flex-1 min-h-0 relative">
          <AppSidebar onSupportClick={() => setIsSupportOpen(true)} />
          <div className="flex-1 min-h-0">
            {activeProject && !isProjectLoading && !isRedirecting && children}
          </div>
        </div>
      </main>

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}
