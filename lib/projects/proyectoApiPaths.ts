const ROUTE_PLACEHOLDER = /^\{id\}$|^\[id\]$/i;

/** Decode route param and reject OpenAPI-style placeholders (`{id}`, `[id]`). */
export function resolveProyectoRouteId(raw: string | undefined): string | null {
  if (raw == null) return null;
  let id = raw;
  try {
    id = decodeURIComponent(raw).trim();
  } catch {
    id = raw.trim();
  }
  if (!id || ROUTE_PLACEHOLDER.test(id)) return null;
  return id;
}

export function assertProyectoId(proyectoId: string): string {
  const resolved = resolveProyectoRouteId(proyectoId);
  if (!resolved) {
    throw new Error(`Invalid proyecto id: "${proyectoId}"`);
  }
  return resolved;
}

/**
 * Suffix under `/api/v1/proyectos` — always interpolates the real UUID.
 * Example: `proyectoApiSuffix(id, "comite")` → `/569d40d2-…/comite`
 */
export function proyectoApiSuffix(proyectoId: string, ...segments: string[]): string {
  const id = assertProyectoId(proyectoId);
  const parts = segments
    .flatMap((segment) => segment.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return `/${encodeURIComponent(id)}`;
  }
  return `/${encodeURIComponent(id)}/${parts.map((part) => encodeURIComponent(part)).join("/")}`;
}

export function assertResolvedApiPath(pathSuffix: string): string {
  if (pathSuffix.includes("{id}") || pathSuffix.includes("[id]")) {
    throw new Error(`Projects API path contains unresolved id placeholder: ${pathSuffix}`);
  }
  return pathSuffix;
}
