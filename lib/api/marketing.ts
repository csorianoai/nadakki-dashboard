const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "tenant_credicefi";

// Fallback chain: LOCAL y PROD tienen endpoints diferentes
async function fetchWithFallback(
  endpoints: string[],
  timeoutMs = 12000
): Promise<{ data: unknown; error: null; endpoint: string } | { data: null; error: string; endpoint: null }> {
  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      const resp = await fetch(API_URL + ep, { signal: ctrl.signal });
      clearTimeout(timer);
      if (resp.ok) return { data: await resp.json(), error: null, endpoint: ep };
    } catch {
      continue;
    }
  }
  return { data: null, error: "No endpoint responded", endpoint: null };
}

export async function fetchMarketingAgents(limit = 1000) {
  const r = await fetchWithFallback([
    `/api/catalog?module=marketing&limit=${limit}`,
    `/api/catalog/marketing/agents?limit=${limit}`,
    `/api/agents?module=marketing&limit=${limit}`,
  ]);
  if (!r.data) return { agents: [], total: 0, error: r.error };
  const json = r.data as Record<string, unknown>;
  const data = json?.data as Record<string, unknown> | undefined;
  const pagination = data?.pagination as { total?: number } | undefined;
  const agents = (data?.agents ?? json?.agents ?? []) as Record<string, unknown>[];
  const total = pagination?.total ?? agents.length;
  return { agents, total, error: null };
}

export async function fetchSocialStatus(tenantId = TENANT_ID) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(`${API_URL}/api/social/status/${tenantId}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) {
      return { data: null, error: `HTTP ${r.status}` };
    }

    // Backend puede envolver la respuesta en { success, data: { ... } }
    const json = await r.json();
    const payload =
      json && typeof json === "object" && "data" in (json as Record<string, unknown>)
        ? (json as { data: unknown }).data
        : json;

    return { data: payload, error: null };
  } catch {
    return { data: null, error: "Not available yet" };
  }
}

export function getOAuthConnectUrl(platform: string, tenantId = TENANT_ID) {
  return `${API_URL}/auth/${platform}/connect/${tenantId}`;
}

export async function disconnectPlatform(platform: string, tenantId = TENANT_ID) {
  return fetch(`${API_URL}/auth/${platform}/disconnect/${tenantId}`, {
    method: "DELETE",
  });
}
