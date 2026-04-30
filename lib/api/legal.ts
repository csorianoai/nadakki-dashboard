import type {
  AgentRunResponse,
  AuditTrailEntry,
  KnowledgePackStatus,
  LegalAgent,
  LegalApiError,
  LegalHealthResponse,
} from "@/types/legal";

const API_BASE = "/api/legal";

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

class LegalApiClient {
  private async fetch<T>(
    path: string,
    options: RequestInit = {},
    tenantId?: string | null
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35_000);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...((options.headers as Record<string, string>) ?? {}),
      };
      if (tenantId?.trim()) {
        headers["X-Tenant-ID"] = tenantId.trim();
      }

      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await parseJsonSafe(res);
        const err: LegalApiError = {
          status: res.status,
          message: res.statusText,
        };
        if (body && typeof body === "object") {
          const o = body as Record<string, unknown>;
          err.message =
            (typeof o.detail === "string" ? o.detail : null) ||
            (typeof o.message === "string" ? o.message : null) ||
            err.message;
          err.request_id = typeof o.request_id === "string" ? o.request_id : err.request_id;
        }
        throw err;
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getHealth(tenantId?: string | null): Promise<LegalHealthResponse> {
    return this.fetch<LegalHealthResponse>("/health", { method: "GET" }, tenantId);
  }

  async getAgents(tenantId: string): Promise<{ agents: LegalAgent[] }> {
    const raw = await this.fetch<unknown>("/agents", { method: "GET" }, tenantId);
    if (raw && typeof raw === "object" && "agents" in raw && Array.isArray((raw as { agents: unknown }).agents)) {
      return raw as { agents: LegalAgent[] };
    }
    if (Array.isArray(raw)) {
      return { agents: raw as LegalAgent[] };
    }
    return { agents: [] };
  }

  async runAgent(tenantId: string, agentId: string, inputs: Record<string, unknown>): Promise<AgentRunResponse> {
    return this.fetch<AgentRunResponse>(
      `/agents/${encodeURIComponent(agentId)}/run`,
      {
        method: "POST",
        body: JSON.stringify({ inputs, tenant_id: tenantId }),
      },
      tenantId
    );
  }

  async getAuditTrail(
    tenantId: string,
    params: { agent_id?: string; limit?: number; status?: string } = {}
  ): Promise<{ entries: AuditTrailEntry[] }> {
    const q = new URLSearchParams();
    q.set("tenant_id", tenantId);
    if (params.agent_id) q.set("agent_id", params.agent_id);
    if (params.limit != null) q.set("limit", String(params.limit));
    if (params.status) q.set("status", params.status);
    const raw = await this.fetch<unknown>(`/audit-trail?${q.toString()}`, { method: "GET" }, tenantId);
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.entries)) return { entries: o.entries as AuditTrailEntry[] };
      if (o.data && typeof o.data === "object" && Array.isArray((o.data as { entries?: unknown }).entries)) {
        return { entries: (o.data as { entries: AuditTrailEntry[] }).entries };
      }
      if (Array.isArray(o.items)) return { entries: o.items as AuditTrailEntry[] };
    }
    if (Array.isArray(raw)) return { entries: raw as AuditTrailEntry[] };
    return { entries: [] };
  }

  async getKnowledgePackStatus(tenantId: string): Promise<KnowledgePackStatus> {
    return this.fetch<KnowledgePackStatus>("/knowledge-pack/status", { method: "GET" }, tenantId);
  }
}

export const legalApiClient = new LegalApiClient();
