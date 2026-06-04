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
  const url = new URL(req.url);
  const query = url.search;
  const target = `${BACKEND_URL}/api/v2/${pathStr}${query}`;

  // Use the resolved tenant_id from middleware (JWT-enforced),
  // falling back to the raw header for backward compat.
  const tenantId =
    req.headers.get("x-resolved-tenant-id") ||
    req.headers.get("x-tenant-id") ||
    "";

  try {
    const headers: Record<string, string> = {};

    // Forward content-type from original request (supports JSON + multipart)
    const ct = req.headers.get("content-type");
    if (ct) headers["Content-Type"] = ct;
    if (!ct && method !== "GET" && method !== "HEAD") {
      headers["Content-Type"] = "application/json";
    }

    if (tenantId) headers["X-Tenant-ID"] = tenantId;

    // Forward Authorization header for backend RLS enforcement.
    const auth =
      req.headers.get("Authorization") || req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    // Forward role/actor headers used by bank endpoints
    const role = req.headers.get("X-Role") || req.headers.get("x-role");
    if (role) headers["X-Role"] = role;
    const actorRole =
      req.headers.get("X-Actor-Role") || req.headers.get("x-actor-role");
    if (actorRole) headers["X-Actor-Role"] = actorRole;
    const actorId =
      req.headers.get("X-Actor-ID") || req.headers.get("x-actor-id");
    if (actorId) headers["X-Actor-ID"] = actorId;
    const correlationId =
      req.headers.get("X-Correlation-ID") ||
      req.headers.get("x-correlation-id");
    if (correlationId) headers["X-Correlation-ID"] = correlationId;
    const idempotencyKey =
      req.headers.get("Idempotency-Key") ||
      req.headers.get("idempotency-key");
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    // SSE support
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
