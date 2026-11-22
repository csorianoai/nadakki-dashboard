import { apiFetch } from "@/lib/api/fetch-client";
import { readLegalJson } from "@/lib/legal/parse-api-error";

const LEGAL_PREFIX = "/api/legal";

function tenantHeaders(tenantId: string): HeadersInit {
  return { "X-Tenant-ID": tenantId.trim() };
}

export async function fetchLibraryStatus(tenantId: string) {
  const res = await apiFetch(`${LEGAL_PREFIX}/library/status`, { headers: tenantHeaders(tenantId) });
  return readLegalJson<Record<string, unknown>>(res, "Error al cargar biblioteca");
}

export async function fetchLibrarySearch(tenantId: string, q: string) {
  const params = new URLSearchParams({ q });
  const res = await apiFetch(`${LEGAL_PREFIX}/library/search?${params.toString()}`, {
    headers: tenantHeaders(tenantId),
  });
  return readLegalJson<{ results?: unknown[] }>(res, "Error en búsqueda de biblioteca");
}
