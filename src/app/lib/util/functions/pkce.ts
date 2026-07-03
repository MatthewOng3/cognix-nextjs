/* eslint-disable */

import crypto from "crypto";

export const pkceStore: Record<string, Record<string, any>> = {};

function base64urlencode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generatePKCE(existingVerifier?: string) {
  const codeVerifier = existingVerifier ?? base64urlencode(crypto.randomBytes(32));
  const codeChallenge = base64urlencode(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  return { codeVerifier, codeChallenge };
}
