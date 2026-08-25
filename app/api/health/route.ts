import { NextRequest, NextResponse } from "next/server";
import { resolveBackendUrl } from "@/lib/config/backend-url";

const BACKEND_URL =
  resolveBackendUrl();

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return new NextResponse(text || res.statusText, { status: res.status });
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
