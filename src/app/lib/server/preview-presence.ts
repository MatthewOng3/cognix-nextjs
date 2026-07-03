// ==== Dokku dev container state ====

type PreviewProjectState = {
  appName: string;
  leases: Map<string, number>;
  idleTimer: NodeJS.Timeout | null;
  transitionPromise: Promise<void> | null;
};

const HEARTBEAT_TTL_MS = 75_000;
const STOP_GRACE_MS = 600_000;

const previewPresence = new Map<string, PreviewProjectState>();

function getOrCreateState(projectId: string, appName: string): PreviewProjectState {
  const existing = previewPresence.get(projectId);
  if (existing) {
    existing.appName = appName;
    return existing;
  }

  const created: PreviewProjectState = {
    appName,
    leases: new Map(),
    idleTimer: null,
    transitionPromise: null,
  };

  previewPresence.set(projectId, created);
  console.log("[preview-presence] created state", {
    projectId,
    appName,
    timestamp: new Date().toISOString(),
  });
  return created;
}

function clearIdleTimer(state: PreviewProjectState) {
  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
    state.idleTimer = null;
  }
}

function logPresenceEvent(
  event: string,
  projectId: string,
  state: PreviewProjectState,
  extra: Record<string, unknown> = {},
) {
  console.log("[preview-presence]", {
    event,
    projectId,
    appName: state.appName,
    activeLeases: state.leases.size,
    leaseIds: Array.from(state.leases.keys()),
    timestamp: new Date().toISOString(),
    ...extra,
  });
}

function pruneExpiredLeases(state: PreviewProjectState, now: number) {
  for (const [leaseId, lastSeenAt] of state.leases.entries()) {
    if (now - lastSeenAt > HEARTBEAT_TTL_MS) {
      state.leases.delete(leaseId);
    }
  }
}

async function runTransition(
  state: PreviewProjectState,
  transition: () => Promise<void>,
) {
  const pending = state.transitionPromise ?? Promise.resolve();

  state.transitionPromise = pending
    .catch(() => undefined)
    .then(transition)
    .finally(() => {
      state.transitionPromise = null;
    });

  await state.transitionPromise;
}

function scheduleIdleStop(
  projectId: string,
  state: PreviewProjectState,
  stopApp: (appName: string) => Promise<void>,
) {
  clearIdleTimer(state);

  logPresenceEvent("schedule-stop", projectId, state, {
    stopGraceMs: STOP_GRACE_MS,
  });

  state.idleTimer = setTimeout(async () => {
    const now = Date.now();
    pruneExpiredLeases(state, now);

    if (state.leases.size > 0) {
      logPresenceEvent("skip-stop-active-leases", projectId, state);
      scheduleIdleStop(projectId, state, stopApp);
      return;
    }

    logPresenceEvent("idle-stop-triggered", projectId, state);
    await runTransition(state, async () => {
      await stopApp(state.appName);
    });

    previewPresence.delete(projectId);
    console.log("[preview-presence] removed state", {
      projectId,
      appName: state.appName,
      timestamp: new Date().toISOString(),
    });
  }, STOP_GRACE_MS);
}

export async function registerPreviewLease(args: {
  projectId: string;
  leaseId: string;
  appName: string;
  startApp: (appName: string) => Promise<void>;
  stopApp: (appName: string) => Promise<void>;
}) {
  const { projectId, leaseId, appName, startApp, stopApp } = args;
  const state = getOrCreateState(projectId, appName);
  const now = Date.now();

  pruneExpiredLeases(state, now);
  clearIdleTimer(state);

  const shouldStart = state.leases.size === 0;
  state.leases.set(leaseId, now);

  logPresenceEvent("lease-start", projectId, state, {
    leaseId,
    shouldStart,
  });

  if (shouldStart) {
    await runTransition(state, async () => {
      logPresenceEvent("app-start-requested", projectId, state, {
        leaseId,
      });
      await startApp(state.appName);
      logPresenceEvent("app-start-complete", projectId, state, {
        leaseId,
      });
    });
  }

  scheduleIdleStop(projectId, state, stopApp);

  return { activeLeases: state.leases.size };
}

export async function heartbeatPreviewLease(args: {
  projectId: string;
  leaseId: string;
  appName: string;
  stopApp: (appName: string) => Promise<void>;
}) {
  const { projectId, leaseId, appName, stopApp } = args;
  const state = getOrCreateState(projectId, appName);
  const now = Date.now();

  pruneExpiredLeases(state, now);
  state.leases.set(leaseId, now);
  logPresenceEvent("lease-heartbeat", projectId, state, {
    leaseId,
  });
  scheduleIdleStop(projectId, state, stopApp);

  return { activeLeases: state.leases.size };
}

export async function unregisterPreviewLease(args: {
  projectId: string;
  leaseId: string;
  appName: string;
  stopApp: (appName: string) => Promise<void>;
}) {
  const { projectId, leaseId, appName, stopApp } = args;
  const state = getOrCreateState(projectId, appName);

  state.leases.delete(leaseId);
  logPresenceEvent("lease-stop", projectId, state, {
    leaseId,
  });

  if (state.leases.size === 0) {
    scheduleIdleStop(projectId, state, stopApp);
  }

  return { activeLeases: state.leases.size };
}
