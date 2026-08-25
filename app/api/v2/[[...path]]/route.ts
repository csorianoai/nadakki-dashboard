/**
 * BFF catch-all proxy for /api/v2/* -> Render backend.
 *
 * Mirrors app/api/v1/[[...path]]/route.ts but targets /api/v2/.
 * Bank decision, claim, detail, queue, analytics, and other v2 endpoints
 * use relative URLs (/api/v2/credit/...) that hit this handler.
 *
 * The Next.js Edge middleware (middleware.ts) runs first, enforcing
 * tenant isolation via JWT claims before this handler forwards the
 * request to the Render backend.
 */
import { NextRequest, NextResponse } from "next/server";
import { buildBffUpstreamHeaders, resolveBffTenantId } from "@/lib/api/bff-proxy-headers";
import { resolveBackendUrl } from "@/lib/config/backend-url";

const BACKEND_URL = resolveBackendUrl().replace(/\/$/, "");

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  const pathStr = path.join("/");
  const url = new URL(req.url);
  const query = url.search;
  const target = `${BACKEND_URL}/api/v2/${pathStr}${query}`;

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

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Upstream error ${res.status}`,
          details: text.slice(0, 500),
        },
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

/**
 * OPTIONS handler — defence-in-depth for CORS preflight.
 *
 * Browsers send OPTIONS with custom headers (Authorization, X-Tenant-ID).
 * Since the BFF is same-origin, the browser should NOT send a preflight, but
 * if a misconfigured client or proxy does, returning 204 prevents a hard 405.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
