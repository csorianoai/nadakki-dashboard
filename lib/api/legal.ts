import type {
  AgentRunResponse,
  AuditTrailEntry,
  KnowledgePackStatus,
  LegalAgent,
  LegalApiError,
  LegalHealthResponse,
} from "@/types/legal";
import type { LegalTask } from "@/lib/legal/task-types";

const API_BASE = "/api/legal";

/** Default timeout for health, audit, tasks, etc. */
export const LEGAL_DEFAULT_FETCH_TIMEOUT_MS = 35_000;

/** chat_asesor_legal: RAG + LLM senior prompt can take 60–120s. */
export const LEGAL_CHAT_AGENT_ID = "chat_asesor_legal";
export const LEGAL_CHAT_AGENT_TIMEOUT_MS = 120_000;

export function formatLegalAgentRunError(err: unknown): string {
  const e = err as LegalApiError & { name?: string };
  const http = e.status ?? 0;
  const raw = e.message ?? "";
  if (
    http === 408 ||
    e.name === "AbortError" ||
    /signal is aborted|aborted without reason|operation was aborted/i.test(raw)
  ) {
    return "La consulta legal tardó demasiado (más de 2 minutos). Intente de nuevo o acorte la pregunta.";
  }
  if (http === 429) return "Límite de tasa excedido. Espere unos segundos.";
  if (http === 504) return "Tiempo de espera agotado en el servidor. Pruebe una consulta más específica.";
  if (http >= 500) return `Error interno (${http}). Si persiste, reporte al equipo.`;
  return raw || "Error al procesar la consulta.";
}

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
    tenantId?: string | null,
    timeoutMs: number = LEGAL_DEFAULT_FETCH_TIMEOUT_MS,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
    } catch (e: unknown) {
      if (controller.signal.aborted) {
        const err: LegalApiError = {
          status: 408,
          message: formatLegalAgentRunError({ status: 408 }),
        };
        throw err;
      }
      throw e;
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
    const timeoutMs =
      agentId === LEGAL_CHAT_AGENT_ID ? LEGAL_CHAT_AGENT_TIMEOUT_MS : LEGAL_DEFAULT_FETCH_TIMEOUT_MS;
    return this.fetch<AgentRunResponse>(
      `/agents/${encodeURIComponent(agentId)}/run`,
      {
        method: "POST",
        body: JSON.stringify({ ...inputs, tenant_id: tenantId }),
      },
      tenantId,
      timeoutMs,
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

  async getTasks(tenantId: string, jurisdiction: string): Promise<{ tasks: LegalTask[] }> {
    const q = new URLSearchParams();
    q.set("jurisdiction", jurisdiction);
    const raw = await this.fetch<unknown>(`/tasks?${q.toString()}`, { method: "GET" }, tenantId);
    if (raw && typeof raw === "object" && "tasks" in raw && Array.isArray((raw as { tasks: unknown }).tasks)) {
      return raw as { tasks: LegalTask[] };
    }
    if (Array.isArray(raw)) {
      return { tasks: raw as LegalTask[] };
    }
    return { tasks: [] };
  }

  async executeTask(
    tenantId: string,
    taskId: string,
    body: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    return this.fetch<Record<string, unknown>>(
      `/tasks/${encodeURIComponent(taskId)}/execute`,
      {
        method: "POST",
        body: JSON.stringify({ ...body, tenant_id: tenantId }),
      },
      tenantId
    );
  }
}

export const legalApiClient = new LegalApiClient();
