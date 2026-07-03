export const DEFAULT_POST_AUTH_REDIRECT = "/project";

export function sanitizeNextPath(
  nextPath: string | null | undefined,
  fallback: string = DEFAULT_POST_AUTH_REDIRECT,
): string {
  if (!nextPath) return fallback;
  if (!nextPath.startsWith("/")) return fallback;
  if (nextPath.startsWith("//")) return fallback;
  return nextPath;
}

export function appendNextParam(path: string, nextPath: string): string {
  const safeNextPath = sanitizeNextPath(nextPath);
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(safeNextPath)}`;
}

// Landing-page prompt handoffs use /project?prompt=...&autoCreate=1 so auth
// pages can tell "resume prompt flow" apart from a normal login/register visit.
export function getAutoCreatePromptFromNextPath(
  nextPath: string,
): string | null {
  const safeNextPath = sanitizeNextPath(nextPath);

  try {
    const parsed = new URL(safeNextPath, "http://localhost");

    if (parsed.pathname !== "/project") return null;
    if (parsed.searchParams.get("autoCreate") !== "1") return null;

    const prompt = parsed.searchParams.get("prompt");
    return prompt?.trim() ? prompt : null;
  } catch {
    return null;
  }
}

// A unique handoff id lets us mark one prompt handoff as "already consumed"
// during auth, which prevents duplicate project creation on remount/retry.
export function buildAutoCreateNextPath(
  prompt: string,
  handoffId: string = crypto.randomUUID(),
): string {
  return `/project?prompt=${encodeURIComponent(prompt)}&autoCreate=1&handoff=${encodeURIComponent(handoffId)}`;
}

export function getAutoCreateHandoffIdFromNextPath(
  nextPath: string,
): string | null {
  const safeNextPath = sanitizeNextPath(nextPath);

  try {
    const parsed = new URL(safeNextPath, "http://localhost");
    if (parsed.pathname !== "/project") return null;
    return parsed.searchParams.get("handoff");
  } catch {
    return null;
  }
}
