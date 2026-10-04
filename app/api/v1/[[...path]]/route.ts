// NEVER forward to /run (RLS bug on backend).
import { NextRequest, NextResponse } from "next/server";
import { buildBffUpstreamHeaders, resolveBffTenantId } from "@/lib/api/bff-proxy-headers";
import { resolveBackendUrl } from "@/lib/config/backend-url";

const BACKEND_URL = resolveBackendUrl().replace(/\/$/, "");

/**
 * Un error del backend se reenvia TAL CUAL: mismo status, mismo cuerpo.
 *
 * Medido en produccion (D8, suite#1501). El proxy reescribia el cuerpo como
 * `{error: "Upstream error <status>", details: "<texto>"}`, y con eso el
 * `detail` del backend dejaba de ser un campo para pasar a ser texto plano
 * dentro de `details`:
 *
 *   directo  api.nadakki.com/api/v1/contable/fiscal/documents
 *            {"detail":"missing_auth"}
 *   proxy    dashboard.nadakki.com/api/v1/contable/fiscal/documents
 *            {"error":"Upstream error 401","details":"{\"detail\":\"missing_auth\"}"}
 *
 * Quien lo paga: el aviso de facturacion electronica. El backend contesta
 * `409 {"detail":{"error":"AR_NOT_CONFIGURED","country":"AR"}}` para un tenant
 * argentino, que NO es un fallo --se emite en ARCA--, pero `leeCuerpoFiscal`
 * busca `detail.error`, no lo encuentra, y acaba leyendo
 * `codigo = "Upstream error 409"`. La pantalla pintaba "No se pudo leer el
 * estado... codigo: Upstream error 409" y la rama ARCA era inalcanzable en
 * produccion. El dispatcher y el componente estaban bien; el proxy no.
 *
 * Un proxy traduce transporte, no semantica. Reescribir el cuerpo de error
 * convierte cada codigo de dominio del backend en una cadena opaca, y la unica
 * forma de recuperarlo seria volver a parsear `details` --un JSON dentro de un
 * string, ya truncado a 500 caracteres.
 */
function upstreamError(res: Response, text: string): NextResponse {
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json",
    },
  });
}

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
      // Bytes, no texto. `req.text()` decodifica como UTF-8 y un multipart
      // con un .xlsx (el importador de D7) llegaba al backend con cada byte
      // no valido cambiado por U+FFFD: un zip roto con su Content-Type
      // intacto. El JSON viaja igual, byte a byte.
      const body = await req.arrayBuffer();
      if (body.byteLength > 0) init.body = body;
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
      return upstreamError(res, text);
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
