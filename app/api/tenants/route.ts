import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nadakki-ai-suite.onrender.com";

export async function GET(req: NextRequest) {
  // Authorization is enforced by middleware.ts — if we reach here,
  // the request has a valid JWT.  Forward it to the backend so the
  // Render RLS middleware can scope the tenant list.
  const auth = req.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/tenants`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": auth,
        ...(req.headers.get("x-resolved-tenant-id") || req.headers.get("x-tenant-id")
          ? { "X-Tenant-ID": (req.headers.get("x-resolved-tenant-id") ?? req.headers.get("x-tenant-id"))! }
          : {}),
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
