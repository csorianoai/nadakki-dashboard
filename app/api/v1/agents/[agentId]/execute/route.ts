// NEVER forward to /run (RLS bug on backend).
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_RENDER_API_URL ||
  "https://nadakki-ai-suite.onrender.com";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const tenantId =
    req.headers.get("X-Tenant-ID") ||
    req.headers.get("x-tenant-id") ||
    "";
  if (!tenantId) {
    return NextResponse.json(
      { error: "X-Tenant-ID header required" },
      { status: 400 }
    );
  }
  try {
    const body = await req.text();
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("Content-Type") || "application/json",
      "X-Tenant-ID": tenantId,
    };
    const auth = req.headers.get("Authorization");
    if (auth) headers["Authorization"] = auth;

    const res = await fetch(`${BACKEND_URL}/api/v1/agents/${agentId}/execute`, {
      method: "POST",
      headers,
      body: body || JSON.stringify({ payload: {}, dry_run: true }),
    });
    const text = await res.text().catch(() => "");
    const contentType = res.headers.get("Content-Type") || "application/json";
    if (contentType.includes("application/json")) {
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { error: text };
      }
      return NextResponse.json(json ?? {}, { status: res.status });
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
