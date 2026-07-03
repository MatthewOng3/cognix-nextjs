"use client";

import React, { useEffect, useRef, useState } from "react";

interface PreviewIframeProps {
  src: string;
  projectId: string;
  refreshKey?: number;
}

export const PreviewIframe: React.FC<PreviewIframeProps> = ({
  src,
  projectId,
  refreshKey = 0,
}) => {
  const [isReachable, setIsReachable] = useState<boolean | null>(null);
  const [activeIframeSrc, setActiveIframeSrc] = useState<string | null>(null);
  const [, setLoaded] = useState(false);
  const checkingRef = useRef(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sourceIdentityRef = useRef<string | null>(null);

  // Build a cache-busted URL whenever refreshKey changes.
  const iframeSrc = React.useMemo(() => {
    if (!src) return src;
    const url = new URL(src);
    url.searchParams.set("_cb", String(refreshKey));
    return url.toString();
  }, [src, refreshKey]);

  useEffect(() => {
    const sourceIdentity = `${projectId}::${src}`;

    if (sourceIdentityRef.current !== sourceIdentity) {
      sourceIdentityRef.current = sourceIdentity;
      setActiveIframeSrc(null);
      setIsReachable(null);
      setLoaded(false);
    }
  }, [projectId, src]);

  useEffect(() => {
    if (!iframeSrc || !projectId) {
      setIsReachable(false);
      return;
    }

    if (!activeIframeSrc) {
      setIsReachable(null);
      setLoaded(false);
    }

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        const response = await fetch(
          `/api/project_preview/status?projectId=${encodeURIComponent(projectId)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const payload = await response.json();
        const ready = !!payload?.data?.ready;

        setIsReachable(ready);
      } catch {
        setIsReachable(false);
      } finally {
        checkingRef.current = false;
      }
    };

    check();

    const interval = setInterval(check, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [activeIframeSrc, iframeSrc, projectId]);

  useEffect(() => {
    if (iframeRef.current && isReachable) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc, isReachable]);

  useEffect(() => {
    if (!isReachable || !iframeSrc) return;

    setActiveIframeSrc((currentSrc) => {
      if (currentSrc === iframeSrc) return currentSrc;
      return iframeSrc;
    });
  }, [iframeSrc, isReachable]);

  const loadingScreen = (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_52%,#1f2937_100%)] p-6 text-white">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[8%] top-[14%] h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-2xl items-center gap-5 rounded-[28px] border border-white/10 bg-white/6 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="relative flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="absolute h-12 w-12 rounded-full border border-amber-300/20" />
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-14 w-14 object-contain opacity-90"
          >
            <source
              src="/animations/Hourglass-Loading.webm"
              type="video/webm"
            />
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />
            Preview starting
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Your app is coming online
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              We&apos;re spinning up the preview. You can keep chatting with the
              builder while this finishes in the background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!activeIframeSrc) {
    return loadingScreen;
  }

  return (
    <iframe
      ref={iframeRef}
      src={activeIframeSrc}
      className="h-full w-full border-0"
      title="App Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      onLoad={() => setLoaded(true)}
    />
  );
};
