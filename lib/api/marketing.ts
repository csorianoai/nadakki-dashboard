import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

function unwrapPayload(json: unknown): Record<string, unknown> {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return { ...o, ...(o.data as Record<string, unknown>) };
  }
  if (o.campaign && typeof o.campaign === "object" && !Array.isArray(o.campaign)) {
    return { ...o, ...(o.campaign as Record<string, unknown>) };
  }
  return o;
}

export function normalizeMarketingAgents(json: unknown): {
  agents: Record<string, unknown>[];
  total: number;
} {
  const o = unwrapPayload(json);
  const raw = o.agents ?? o.items ?? (Array.isArray(json) ? json : []);
  const agents = Array.isArray(raw)
    ? raw.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>)
    : [];
  const total = typeof o.total === "number" ? o.total : agents.length;
  return { agents, total };
}

/** Best-effort agent count from GET /health (or wrapped payload). */
export function agentCountFromHealthJson(json: unknown): number | null {
  if (!json || typeof json !== "object") return null;
  const o = unwrapPayload(json);
  const tryNum = (v: unknown): number | null => {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
    return null;
  };
  const direct = [o.agent_count, o.agents_count, o.total_agents, o.marketing_agents];
  for (const v of direct) {
    const n = tryNum(v);
    if (n !== null) return n;
  }
  if (Array.isArray(o.agents)) return o.agents.length;
  const m = o.marketing;
  if (m && typeof m === "object") {
    const mo = m as Record<string, unknown>;
    for (const key of ["agents_count", "agent_count", "total"]) {
      const n = tryNum(mo[key]);
      if (n !== null) return n;
    }
  }
  return null;
}

export function normalizeMarketingCampaigns(json: unknown): {
  campaigns: Record<string, unknown>[];
  total: number;
} {
  const o = unwrapPayload(json);
  const raw = o.campaigns ?? o.items ?? (Array.isArray(json) ? json : []);
  const campaigns = Array.isArray(raw)
    ? raw.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>)
    : [];
  const total = typeof o.total === "number" ? o.total : campaigns.length;
  return { campaigns, total };
}

export function normalizeMarketingTemplates(json: unknown): {
  templates: Record<string, unknown>[];
  total: number;
} {
  const o = unwrapPayload(json);
  const raw = o.templates ?? o.items ?? (Array.isArray(json) ? json : []);
  const templates = Array.isArray(raw)
    ? raw.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>)
    : [];
  const total = typeof o.total === "number" ? o.total : templates.length;
  return { templates, total };
}

export function normalizeMarketingSegmentsList(json: unknown): {
  segments: Record<string, unknown>[];
  total: number;
} {
  const o = unwrapPayload(json);
  const raw = o.segments ?? o.items ?? (Array.isArray(json) ? json : []);
  const segments = Array.isArray(raw)
    ? raw.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>)
    : [];
  const total = typeof o.total === "number" ? o.total : segments.length;
  return { segments, total };
}

export async function fetchMarketingAgents(
  tenantId?: string | null,
  limit = 1000
): Promise<{
  agents: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  const base = MARKETING_ENDPOINTS.AGENTS;
  const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}`;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: {},
  });
  const norm = normalizeMarketingAgents(r.source === "live" ? r.data : {});
  return {
    agents: norm.agents,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export async function fetchMarketingCampaigns(tenantId?: string | null): Promise<{
  campaigns: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  const url = MARKETING_ENDPOINTS.CAMPAIGNS;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: {},
  });
  const norm = normalizeMarketingCampaigns(r.source === "live" ? r.data : {});
  return {
    campaigns: norm.campaigns,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export async function fetchMarketingSegments(tenantId?: string | null): Promise<{
  segments: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  const url = MARKETING_ENDPOINTS.SEGMENTS;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: {},
  });
  const norm = normalizeMarketingSegmentsList(r.source === "live" ? r.data : {});
  return {
    segments: norm.segments,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export async function fetchMarketingCampaignById(
  id: string,
  tenantId?: string | null
): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
  source: FetchSource;
}> {
  const url = MARKETING_ENDPOINTS.CAMPAIGN_BY_ID(id);
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: {},
  });
  if (r.source !== "live" || !r.data || typeof r.data !== "object") {
    return {
      data: null,
      error: r.error,
      source: r.source,
    };
  }
  const o = unwrapPayload(r.data);
  return { data: o, error: null, source: "live" };
}

export async function fetchSocialStatus(tenantId: string) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(`${API_URL}/api/social/status/${tenantId}`, {
      headers: { "X-Tenant-ID": tenantId },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) {
      return { data: null, error: `HTTP ${r.status}` };
    }

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

export function getOAuthConnectUrl(platform: string, tenantId: string) {
  return `${API_URL}/auth/${platform}/connect/${tenantId}`;
}

export async function disconnectPlatform(platform: string, tenantId: string) {
  return fetch(`${API_URL}/auth/${platform}/disconnect/${tenantId}`, {
    method: "DELETE",
  });
}
