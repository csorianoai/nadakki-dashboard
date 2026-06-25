// lib/legal-cockpit/api.ts
// safeFetch: nunca rompe render, siempre retorna resultado

type SafeOk<T> = { ok: true; data: T; demoData: false };
type SafeFail = { ok: false; error: string; demoData: true };
type SafeResult<T> = SafeOk<T> | SafeFail;

async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  tenantId?: string
): Promise<SafeResult<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
      ...(tenantId ? { "X-Tenant-ID": tenantId } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, demoData: true };
    }
    const data = (await res.json()) as T;
    return { ok: true, data, demoData: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch_error";
    return { ok: false, error: msg, demoData: true };
  }
}

export type LegalHealthResponse = {
  status: string;
  checks: Record<string, boolean>;
  version?: string;
  uptime_seconds?: number;
};

type RawAgentsResponse = unknown;

// Normalizar cualquier formato de respuesta de /api/legal/agents
export function normalizeAgentsResponse(input: RawAgentsResponse): {
  agents: unknown[];
  total: number;
} {
  if (Array.isArray(input)) {
    return { agents: input, total: input.length };
  }
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.agents)) {
      return {
        agents: obj.agents,
        total: typeof obj.total === "number" ? obj.total : obj.agents.length,
      };
    }
    if (Array.isArray(obj.items)) {
      return {
        agents: obj.items,
        total: typeof obj.total === "number" ? obj.total : obj.items.length,
      };
    }
  }
  return { agents: [], total: 0 };
}

export async function fetchLegalHealth(tenantId?: string) {
  return safeFetch<LegalHealthResponse>("/api/legal/health?deep=true", {}, tenantId);
}

export async function fetchLegalAgents(tenantId?: string) {
  return safeFetch<RawAgentsResponse>("/api/legal/agents", {}, tenantId);
}

export async function fetchAuditTrail(tenantId?: string) {
  return safeFetch<{ entries: unknown[] }>("/api/legal/audit-trail", {}, tenantId);
}

export async function fetchKnowledgePackStatus(tenantId?: string) {
  return safeFetch<Record<string, unknown>>(
    "/api/legal/knowledge-pack/status",
    {},
    tenantId
  );
}
