import type { NextRequest } from "next/server";

/**
 * Shared upstream headers for v1/v2 BFF catch-all proxies (PR #105 / Sprint 3 Sub-B).
 */
export function resolveBffTenantId(req: NextRequest): string {
  return (
    req.headers.get("x-resolved-tenant-id") ||
    req.headers.get("x-tenant-id") ||
    ""
  );
}

export function buildBffUpstreamHeaders(
  req: NextRequest,
  method: string,
  tenantId: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  const ct = req.headers.get("content-type");
  if (ct) headers["Content-Type"] = ct;
  else if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  if (tenantId) headers["X-Tenant-ID"] = tenantId;

  // Dominio publico del portal (mapaal.nadakki.com): el backend acota el buscador al tenant de ese dominio (F4A-1, F-4) y,
  // detras de este BFF, su `Host` es el del propio backend. Sale SOLO del host real de la peticion; un X-Portal-Host del
  // cliente no se reenvia.
  const portalHost = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(",")[0]
    .trim();
  if (portalHost) headers["X-Portal-Host"] = portalHost;

  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  // X-Role is client-controlled: never forward it. The backend derives the role from the token.

  const actorRole =
    req.headers.get("X-Actor-Role") || req.headers.get("x-actor-role");
  if (actorRole) headers["X-Actor-Role"] = actorRole;

  const actorId = req.headers.get("X-Actor-ID") || req.headers.get("x-actor-id");
  if (actorId) headers["X-Actor-ID"] = actorId;

  const correlationId =
    req.headers.get("X-Correlation-ID") || req.headers.get("x-correlation-id");
  if (correlationId) headers["X-Correlation-ID"] = correlationId;

  const idempotencyKey =
    req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  if (req.headers.get("Accept")?.includes("text/event-stream")) {
    headers["Accept"] = "text/event-stream";
  }
  if (req.headers.get("Last-Event-ID")) {
    headers["Last-Event-ID"] = req.headers.get("Last-Event-ID")!;
  }

  return headers;
}
