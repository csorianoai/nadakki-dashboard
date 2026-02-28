import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_RENDER_API_URL ||
  "https://nadakki-ai-suite.onrender.com";

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tenants`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Role": "admin",
        "X-Tenant-ID": req.headers.get("X-Tenant-ID") ?? req.headers.get("x-tenant-id") ?? "credicefi",
      },
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `HTTP ${res.status} ${res.statusText} | /api/v1/tenants | ${text.slice(0, 300)}`,
        },
        { status: res.status }
      );
    }
    const json = text ? JSON.parse(text) : null;
    return NextResponse.json(json);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
