import { NextRequest } from "next/server";

export function getIpFromRequest(req: NextRequest) {
    // Next.js Edge/Serverless environment:
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      // may contain a CSV of IPs
      return xff.split(",")[0].trim();
    }
    // fallback
    // @ts-ignore
    return req.ip || req.headers.get("x-real-ip") || "unknown";
}