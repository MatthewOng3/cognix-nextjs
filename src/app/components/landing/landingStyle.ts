export const landingStyles = ["swiss", "space", "beta"] as const;

export type LandingStyle = (typeof landingStyles)[number];

export function normalizeLandingStyle(
  value: string | string[] | undefined,
): LandingStyle {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === "space") {
    return "space";
  }
  if (candidate === "beta") {
    return "beta";
  }

  return "swiss";
}

export function getLandingStyleHref(style: LandingStyle): string {
  if (style === "beta") {
    return "/?style=beta";
  }
  if (style === "space") {
    return "/?style=space";
  }
  return "/?style=swiss";
}
