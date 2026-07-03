"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 25_000;

async function postPresence(
  projectId: string,
  leaseId: string,
  action: "start" | "heartbeat" | "stop",
  keepalive = false,
) {
  return fetch("/api/project_preview/runtime", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    keepalive,
    body: JSON.stringify({
      projectId,
      leaseId,
      action,
    }),
  });
}

/**
 * @description Hook to manage user project dokku dev container start and stop states.
 * Connects to project preview runtime route 
 * @param projectId 
 * @param enabled 
 */
export function usePreviewPresence(projectId: string | null, enabled = true) {
  //Refers to the preview app that is currently running
  const leaseIdRef = useRef<string | null>(null);

  if (!leaseIdRef.current && typeof crypto !== "undefined") {
    leaseIdRef.current = crypto.randomUUID();
  }

  useEffect(() => {
    if (!projectId || !enabled || !leaseIdRef.current) {
      return;
    }

    const leaseId = leaseIdRef.current;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPresence = async () => {
      try {
        await postPresence(projectId, leaseId, "start");
      } catch (error) {
        console.error("Failed to start preview presence", error);
      }
    };

    const heartbeat = async () => {
      try {
        await postPresence(projectId, leaseId, "heartbeat");
      } catch (error) {
        console.error("Failed to heartbeat preview presence", error);
      }
    };

    const stopPresence = () => {
      void postPresence(projectId, leaseId, "stop", true).catch((error) => {
        console.error("Failed to stop preview presence", error);
      });
    };

    void startPresence();
    intervalId = setInterval(() => {
      void heartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const handlePageHide = () => {
      stopPresence();
    };

    //Stop the preview once page is hidden
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (intervalId) {
        clearInterval(intervalId);
      }
      stopPresence();
    };
  }, [enabled, projectId]);
}
