import { type NextRequest, NextResponse } from "next/server";

/**
 * Returns best-effort client IP from proxy headers (server-only).
 * Used by dealer consent flow metadata; never trust for security decisions alone.
 */
export function GET(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const fromForwarded = forwarded?.split(",")[0]?.trim() || null;
  const ip = fromForwarded || request.headers.get("x-real-ip")?.trim() || null;
  return NextResponse.json({ ip });
}
