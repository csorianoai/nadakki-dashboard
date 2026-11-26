import { NextRequest, NextResponse } from "next/server";
import { buildBffUpstreamHeaders, resolveBffTenantId } from "@/lib/api/bff-proxy-headers";
import { resolveBackendUrl } from "@/lib/config/backend-url";

const BACKEND_URL = resolveBackendUrl().replace(/\/$/, "");
const ALLOWED = new Set(["contable/chat", "contable/ia/chat", "contable/ia/confirmar"]);
// Ejecuta una accion propuesta por el asistente: solo POST (el backend no tiene GET y un GET no debe llegar).
const POST_ONLY = new Set(["contable/ia/confirmar"]);

async function proxy(req: NextRequest, path: string[], method: "GET" | "POST") {
  const route = path.join("/");
  if (!ALLOWED.has(route)) return NextResponse.json({ detail: "Not Found" }, { status: 404 });
  if (method !== "POST" && POST_ONLY.has(route)) {
    return NextResponse.json({ detail: "Method Not Allowed" }, { status: 405, headers: { Allow: "POST" } });
  }
  try {
    const headers = buildBffUpstreamHeaders(req, method, resolveBffTenantId(req));
    const init: RequestInit = { method, headers, cache: "no-store" };
    if (method === "POST") {
      const body = await req.arrayBuffer();
      if (body.byteLength) init.body = body;
    }
    const response = await fetch(`${BACKEND_URL}/api/assistant/${route}${new URL(req.url).search}`, init);
    if ([204, 205, 304].includes(response.status)) return new NextResponse(null, { status: response.status });
    // Preserve upstream bytes, status and content type, including error bodies.
    const out = new Headers({ "Content-Type": response.headers.get("Content-Type") || "application/json" });
    for (const name of ["Content-Disposition", "Cache-Control"]) {
      const value = response.headers.get(name);
      if (value) out.set(name, value);
    }
    return new NextResponse(await response.arrayBuffer(), { status: response.status, headers: out });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
type Context = { params: Promise<{ path?: string[] }> };
export async function GET(req: NextRequest, { params }: Context) { return proxy(req, (await params).path ?? [], "GET"); }
export async function POST(req: NextRequest, { params }: Context) { return proxy(req, (await params).path ?? [], "POST"); }
