// NEVER forward to /run (RLS bug on backend).
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_RENDER_API_URL ||
  "https://nadakki-ai-suite.onrender.com";

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  const pathStr = path.join("/");
  if (pathStr.includes("/run") || path[path.length - 1] === "run") {
    return NextResponse.json(
      { error: "/run is disabled; use /execute instead (RLS bug)" },
      { status: 400 }
    );
  }
  const url = new URL(req.url);
  const query = url.search;
  const target = `${BACKEND_URL}/api/v1/${pathStr}${query}`;
  const tenantId =
    req.headers.get("X-Tenant-ID") ||
    req.headers.get("x-tenant-id") ||
    "credicefi";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
    };
    if (path[0] === "tenants" && path.length === 1) {
      headers["X-Role"] = "admin";
    }
    const auth = req.headers.get("Authorization");
    if (auth) headers["Authorization"] = auth;
    if (req.headers.get("Accept")?.includes("text/event-stream")) {
      headers["Accept"] = "text/event-stream";
    }
    if (req.headers.get("Last-Event-ID")) {
      headers["Last-Event-ID"] = req.headers.get("Last-Event-ID")!;
    }

    const init: RequestInit = { method, headers };
    if (method !== "GET" && method !== "HEAD") {
      const body = await req.text();
      if (body) init.body = body;
    }

    const res = await fetch(target, { ...init, cache: "no-store" });
    const text = await res.text().catch(() => "");

    const isRunsPath =
      Array.isArray(path) &&
      path.length >= 3 &&
      path[0] === "tenants" &&
      path[2] === "runs";

    if (!res.ok) {
      if (isRunsPath && (res.status === 500 || res.status === 503)) {
        const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20") || 20;
        const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0") || 0;
        return NextResponse.json(
          { runs: [], pagination: { limit, offset, total: 0 } },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: `Upstream error ${res.status}`, details: text.slice(0, 500) },
        { status: res.status }
      );
    }
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const json = text ? JSON.parse(text) : null;
      return NextResponse.json(json);
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  return proxyRequest(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  return proxyRequest(req, path, "POST");
}
