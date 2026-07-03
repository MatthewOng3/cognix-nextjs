import { useEffect, useRef } from "react";
import { createSupabaseClient } from "../lib/util/supabase/client";

export type DeploymentUpdatePayload = {
    id: number;
    project_id: string;
    session_id: string;
    git_sha: string;
    branch: string;
    status: string;
    error_message: string;
    started_at: string;
    finished_at: string;
    duration_seconds: number;
    is_successful: boolean;
};

export function useSupabaseChannel(
    projectId: string | undefined,
    onUpdate: (payload: DeploymentUpdatePayload) => void
) {
    const onUpdateRef = useRef(onUpdate);
    const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<ReturnType<ReturnType<typeof createSupabaseClient>["channel"]> | null>(null);
    const isUnsubscribingRef = useRef(false); // Track intentional unsubscribes

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!projectId) return;

        const supabase = createSupabaseClient();
        const channelName = `deployment:${projectId}`;
        let retryAttempts = 0;

        const subscribe = () => {
            console.log(`[Realtime] Subscribing to channel: ${channelName}`);

            if (channelRef.current) {
                console.log("[Realtime] Unsubscribing old channel before recreate");
                isUnsubscribingRef.current = true; // Mark as intentional
                channelRef.current.unsubscribe();
            }
            
            const channel = supabase
                .channel(channelName, { config: { private: true } })
                .on(
                    "broadcast",
                    { event: "UPDATE" },
                    (payload: { payload: { record: DeploymentUpdatePayload } }) => {
                        onUpdateRef.current(payload.payload.record);
                    }
                )
                .subscribe((status, err) => {
                    console.log("[Realtime] Status:", status);

                    if (err) {
                        console.error("[Realtime] Channel error:", err);
                    }

                    if (status === "SUBSCRIBED") {
                        console.log("[Realtime] Connected");
                        retryAttempts = 0;
                        isUnsubscribingRef.current = false; // Reset flag on successful connection
                    }

                    if (["CHANNEL_ERROR", "TIMED_OUT"].includes(status)) {
                        console.warn("[Realtime] Error or timeout. Reconnecting…");
                        retryReconnect();
                    }

                    if (status === "CLOSED") {
                        // Only reconnect if this was NOT an intentional unsubscribe
                        if (!isUnsubscribingRef.current) {
                            console.warn("[Realtime] Channel unexpectedly closed. Reconnecting…");
                            retryReconnect();
                        } else {
                            console.log("[Realtime] Channel closed intentionally (during reconnect)");
                        }
                    }
                });

            channelRef.current = channel;
        };

        const retryReconnect = () => {
            if (retryTimerRef.current) return; // Already scheduled

            retryAttempts += 1;
            const delay = Math.min(1000 * retryAttempts, 8000);

            console.warn(`[Realtime] Reconnect attempt #${retryAttempts} in ${delay}ms`);

            retryTimerRef.current = setTimeout(() => {
                retryTimerRef.current = null;
                subscribe();
            }, delay);
        };

        subscribe();

        return () => {
            console.log("[Realtime] Cleanup unsubscribing…");
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (channelRef.current) {
                isUnsubscribingRef.current = true; // Mark cleanup as intentional
                channelRef.current.unsubscribe();
            }
        };
    }, [projectId]);
}