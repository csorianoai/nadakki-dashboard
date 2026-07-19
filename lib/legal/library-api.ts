const LEGAL_PREFIX = "/api/legal";

function tenantHeaders(tenantId: string): HeadersInit {
  return { "X-Tenant-ID": tenantId.trim() };
}

export async function fetchLibraryStatus(tenantId: string) {
  const res = await fetch(`${LEGAL_PREFIX}/library/status`, { headers: tenantHeaders(tenantId) });
  if (!res.ok) throw new Error(`Error al cargar biblioteca (${res.status})`);
  return res.json() as Promise<Record<string, unknown>>;
}

export async function fetchLibrarySearch(tenantId: string, q: string) {
  const params = new URLSearchParams({ q });
  const res = await fetch(`${LEGAL_PREFIX}/library/search?${params.toString()}`, {
    headers: tenantHeaders(tenantId),
  });
  if (!res.ok) throw new Error(`Error en búsqueda de biblioteca (${res.status})`);
  return res.json() as Promise<{ results?: unknown[] }>;
}
