// NEVER forward to /run (RLS bug on backend).
import { NextRequest, NextResponse } from "next/server";
import { buildBffUpstreamHeaders, resolveBffTenantId } from "@/lib/api/bff-proxy-headers";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_NADAKKI_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://nadakki-ai-suite.onrender.com"
).replace(/\/$/, "");

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  const pathStr = path.join("/");
  // Block legacy tenant run endpoints that hit /run (RLS); allow known safe /run paths:
  // - ops/google-ads-agent/checks/run (Agent check runner)
  // - governance/run (NGC audit trigger)
  const isGoogleAdsAgentOpsChecks = pathStr.startsWith("ops/google-ads-agent/checks/");
  const isGovernanceRun = pathStr === "governance/run";
  if (
    !isGoogleAdsAgentOpsChecks &&
    !isGovernanceRun &&
    (pathStr.includes("/run") || path[path.length - 1] === "run")
  ) {
    return NextResponse.json(
      { error: "/run is disabled; use /execute instead (RLS bug)" },
      { status: 400 }
    );
  }
  const url = new URL(req.url);
  const query = url.search;
  const target = `${BACKEND_URL}/api/v1/${pathStr}${query}`;
  const tenantId = resolveBffTenantId(req);

  try {
    const headers = buildBffUpstreamHeaders(req, method, tenantId);

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  return proxyRequest(req, path, "PUT");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  return proxyRequest(req, path, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  return proxyRequest(req, path, "DELETE");
}
