import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { CAMPAIGNS_API, MARKETING_ENDPOINTS } from "@/lib/api/endpoints";
import { tokenStorage } from "@/lib/auth/token-storage";

/** Same-origin; proxied via next.config rewrites */
const API_URL = "";
const BACKEND_URL = "https://nadakki-ai-suite.onrender.com";

/** Attach JWT Authorization header if available (tenant isolation). */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (typeof window !== "undefined") {
    const token = tokenStorage.getAccessToken();
    if (token && !h["Authorization"]) {
      h["Authorization"] = `Bearer ${token}`;
    }
  }
  return h;
}

/** Stable reference for fetchWithFallback (avoids a fresh `{}` per call). */
const FALLBACK_EMPTY_JSON: Record<string, unknown> = {};

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
  const pagination = o.pagination;
  const paginationTotal =
    pagination && typeof pagination === "object" && typeof (pagination as Record<string, unknown>).total === "number"
      ? ((pagination as Record<string, unknown>).total as number)
      : null;
  const total = typeof o.total === "number" ? o.total : paginationTotal ?? agents.length;
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
    fallbackData: FALLBACK_EMPTY_JSON,
  });
  const norm = normalizeMarketingAgents(r.source === "live" ? r.data : {});
  return {
    agents: norm.agents,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export type UpdateMarketingCampaignResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

/** PATCH /api/marketing/campaigns/{id} — partial update (e.g. status). */
export async function patchMarketingCampaignStatus(
  tenantId: string,
  campaignId: string,
  status: "approved" | "rejected"
): Promise<UpdateMarketingCampaignResult> {
  const url = MARKETING_ENDPOINTS.CAMPAIGN_BY_ID(campaignId);
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify({ status }),
    });
    const httpStatus = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      let detailStr = `HTTP ${httpStatus}`;
      if (json && typeof json === "object" && json !== null && "detail" in json) {
        const d = (json as { detail: unknown }).detail;
        if (typeof d === "string") detailStr = d;
        else if (Array.isArray(d))
          detailStr = d
            .map((x) =>
              typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)
            )
            .join("; ");
        else detailStr = JSON.stringify(d);
      }
      return { ok: false, data: null, error: detailStr, status: httpStatus };
    }
    if (!json || typeof json !== "object") {
      return { ok: true, data: {}, error: null, status: httpStatus };
    }
    return { ok: true, data: json as Record<string, unknown>, error: null, status: httpStatus };
  } catch (e) {
    return {
      ok: false,
      data: null,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
}

/** PUT /api/marketing/campaigns/{id} — body must match campaigns_v2 CampaignUpdate */
export async function updateMarketingCampaign(
  tenantId: string,
  campaignId: string,
  payload: Record<string, unknown>
): Promise<UpdateMarketingCampaignResult> {
  const url = MARKETING_ENDPOINTS.CAMPAIGN_BY_ID(campaignId);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(payload),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      let detailStr = `HTTP ${status}`;
      if (json && typeof json === "object" && json !== null && "detail" in json) {
        const d = (json as { detail: unknown }).detail;
        if (typeof d === "string") detailStr = d;
        else if (Array.isArray(d))
          detailStr = d
            .map((x) =>
              typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)
            )
            .join("; ");
        else detailStr = JSON.stringify(d);
      }
      return { ok: false, data: null, error: detailStr, status };
    }
    if (!json || typeof json !== "object") {
      return { ok: true, data: {}, error: null, status };
    }
    return { ok: true, data: json as Record<string, unknown>, error: null, status };
  } catch (e) {
    return {
      ok: false,
      data: null,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
}

export async function fetchMarketingCampaigns(tenantId?: string | null): Promise<{
  campaigns: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  /** Header X-Tenant-ID is primary; ?tenant_id= is backward-compatible if proxies strip the header. */
  const qs =
    tenantId != null && tenantId !== ""
      ? `?tenant_id=${encodeURIComponent(tenantId)}`
      : "";
  const url = `${MARKETING_ENDPOINTS.CAMPAIGNS}${qs}`;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: FALLBACK_EMPTY_JSON,
  });
  const norm = normalizeMarketingCampaigns(r.source === "live" ? r.data : {});
  return {
    campaigns: norm.campaigns,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

/** Uses fetchWithFallback with module-stable empty fallback. */
export async function fetchMarketingSegments(tenantId?: string | null): Promise<{
  segments: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  const url = MARKETING_ENDPOINTS.SEGMENTS;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: FALLBACK_EMPTY_JSON,
  });
  const norm = normalizeMarketingSegmentsList(r.source === "live" ? r.data : {});
  return {
    segments: norm.segments,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export async function fetchMarketingTemplates(tenantId?: string | null): Promise<{
  templates: Record<string, unknown>[];
  total: number;
  error: string | null;
  source: FetchSource;
}> {
  const qs =
    tenantId != null && tenantId !== ""
      ? `?tenant_id=${encodeURIComponent(tenantId)}`
      : "";
  const url = `${MARKETING_ENDPOINTS.TEMPLATES}${qs}`;
  const r = await fetchWithFallback<unknown>(url, {
    tenantId: tenantId ?? undefined,
    fallbackData: FALLBACK_EMPTY_JSON,
  });
  const norm = normalizeMarketingTemplates(r.source === "live" ? r.data : {});
  return {
    templates: norm.templates,
    total: norm.total,
    error: r.source === "fallback" ? r.error : null,
    source: r.source,
  };
}

export type CreateMarketingCampaignResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

/** POST /api/marketing/campaigns — requires name, objective, channel, segment_id, template_id + optional snapshots */
export async function createMarketingCampaign(
  tenantId: string,
  body: Record<string, unknown>
): Promise<CreateMarketingCampaignResult> {
  const url = MARKETING_ENDPOINTS.CAMPAIGNS;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(body),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      let detailStr = `HTTP ${status}`;
      if (json && typeof json === "object" && json !== null && "detail" in json) {
        const d = (json as { detail: unknown }).detail;
        if (typeof d === "string") detailStr = d;
        else if (Array.isArray(d))
          detailStr = d
            .map((x) =>
              typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)
            )
            .join("; ");
        else detailStr = JSON.stringify(d);
      }
      return { ok: false, data: null, error: detailStr, status };
    }
    if (!json || typeof json !== "object") {
      return { ok: true, data: {}, error: null, status };
    }
    return {
      ok: true,
      data: json as Record<string, unknown>,
      error: null,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      data: null,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
}

export type ActivateCampaignResult = {
  ok: boolean;
  error: string | null;
  status: number;
};

export async function activateMarketingCampaign(
  tenantId: string,
  campaignId: string
): Promise<ActivateCampaignResult> {
  const url = CAMPAIGNS_API.ACTIVATE(campaignId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({
        Accept: "application/json",
        "X-Tenant-ID": tenantId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detail =
        err && typeof err === "object" && "detail" in err
          ? String((err as { detail: unknown }).detail)
          : `HTTP ${res.status}`;
      return { ok: false, error: detail, status: res.status };
    }
    return { ok: true, error: null, status: res.status };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
}

export type ExecuteCampaignResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

/** POST /api/marketing/campaigns/{id}/execute — falls back to activate if execute route missing. */
export async function executeMarketingCampaign(
  tenantId: string,
  campaignId: string,
  body: Record<string, unknown> = {},
): Promise<ExecuteCampaignResult> {
  const url = MARKETING_ENDPOINTS.CAMPAIGN_EXECUTE(campaignId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(body),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (res.ok) {
      const data =
        json && typeof json === "object" ? (json as Record<string, unknown>) : {};
      return { ok: true, data, error: null, status };
    }
    if (status === 404 || status === 405) {
      const activated = await activateMarketingCampaign(tenantId, campaignId);
      return {
        ok: activated.ok,
        data: activated.ok ? { activated: true, campaign_id: campaignId } : null,
        error: activated.error,
        status: activated.status,
      };
    }
    return {
      ok: false,
      data: null,
      error: formatHttpDetail(json, `HTTP ${status}`),
      status,
    };
  } catch (e) {
    return {
      ok: false,
      data: null,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
}

export type LaunchPilotResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

/** POST same-origin → backend /marketing/campaigns/launch-pilot (Meta pilot sequence; default dry_run). */
export async function postMarketingLaunchPilot(
  tenantId: string,
  body: Record<string, unknown>
): Promise<LaunchPilotResult> {
  const url = MARKETING_ENDPOINTS.CAMPAIGN_LAUNCH_PILOT;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(body),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      const detail =
        json && typeof json === "object" && json !== null && "detail" in json
          ? String((json as { detail: unknown }).detail)
          : `HTTP ${status}`;
      return { ok: false, data: null, error: detail, status };
    }
    if (!json || typeof json !== "object") {
      return { ok: true, data: {}, error: null, status };
    }
    return {
      ok: true,
      data: json as Record<string, unknown>,
      error: null,
      status,
    };
  } catch (e) {
    return {
      ok: false,
      data: null,
      error: (e as Error)?.message ?? "Network error",
      status: 0,
    };
  }
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
    fallbackData: FALLBACK_EMPTY_JSON,
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

function formatHttpDetail(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && json !== null && "detail" in json) {
    const d = (json as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((x) =>
          typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)
        )
        .join("; ");
    return JSON.stringify(d);
  }
  return fallback;
}

/** GET /api/marketing/journeys — same-origin; X-Tenant-ID + optional ?tenant_id= fallback. */
export async function fetchMarketingJourneys(tenantId: string): Promise<{
  journeys: Record<string, unknown>[];
  error: string | null;
}> {
  const qs = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
  const url = `${MARKETING_ENDPOINTS.JOURNEYS}${qs}`;
  try {
    const res = await fetch(url, {
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { journeys: [], error: formatHttpDetail(json, `HTTP ${res.status}`) };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const raw = o.journeys;
    const journeys = Array.isArray(raw)
      ? raw.filter((x) => x && typeof x === "object").map((x) => x as Record<string, unknown>)
      : [];
    return { journeys, error: null };
  } catch (e) {
    return { journeys: [], error: (e as Error)?.message ?? "Network error" };
  }
}

/** GET /api/marketing/journeys/{id} — returns journey row or error. */
export async function fetchMarketingJourneyById(
  tenantId: string,
  journeyId: string
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const url = MARKETING_ENDPOINTS.JOURNEY_BY_ID(journeyId);
  try {
    const res = await fetch(url, {
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { data: null, error: formatHttpDetail(json, `HTTP ${res.status}`) };
    }
    if (!json || typeof json !== "object") return { data: null, error: "Invalid response" };
    return { data: json as Record<string, unknown>, error: null };
  } catch (e) {
    return { data: null, error: (e as Error)?.message ?? "Network error" };
  }
}

export type JourneyMutationResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

export async function createMarketingJourney(
  tenantId: string,
  body: Record<string, unknown>
): Promise<JourneyMutationResult> {
  const url = MARKETING_ENDPOINTS.JOURNEYS;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(body),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const inner = o.journey && typeof o.journey === "object" ? (o.journey as Record<string, unknown>) : o;
    return { ok: true, data: inner, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

export async function updateMarketingJourney(
  tenantId: string,
  journeyId: string,
  body: Record<string, unknown>
): Promise<JourneyMutationResult> {
  const url = MARKETING_ENDPOINTS.JOURNEY_BY_ID(journeyId);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      }),
      body: JSON.stringify(body),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const inner = o.journey && typeof o.journey === "object" ? (o.journey as Record<string, unknown>) : o;
    return { ok: true, data: inner, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

export async function activateMarketingJourney(
  tenantId: string,
  journeyId: string
): Promise<JourneyMutationResult> {
  const url = MARKETING_ENDPOINTS.JOURNEY_ACTIVATE(journeyId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const inner = o.journey && typeof o.journey === "object" ? (o.journey as Record<string, unknown>) : o;
    return { ok: true, data: inner, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

export async function pauseMarketingJourney(
  tenantId: string,
  journeyId: string
): Promise<JourneyMutationResult> {
  const url = MARKETING_ENDPOINTS.JOURNEY_PAUSE(journeyId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const inner = o.journey && typeof o.journey === "object" ? (o.journey as Record<string, unknown>) : o;
    return { ok: true, data: inner, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

export type JourneyRunResult = {
  ok: boolean;
  data: Record<string, unknown> | null;
  error: string | null;
  status: number;
};

export type JourneyHistoryRun = {
  id: string;
  journey_id: string;
  tenant_id: string;
  timestamp: string;
  status: string;
  message: string;
};

/** POST /api/marketing/journeys/{id}/run — manual execution MVP (no scheduler/engine). */
export async function runMarketingJourney(
  tenantId: string,
  journeyId: string
): Promise<JourneyRunResult> {
  const url = MARKETING_ENDPOINTS.JOURNEY_RUN(journeyId);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    return { ok: true, data: o, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

/** GET /api/marketing/journeys/{id}/runs — returns up to 5 recent runs. */
export async function fetchMarketingJourneyRuns(
  tenantId: string,
  journeyId: string
): Promise<{ runs: JourneyHistoryRun[]; error: string | null }> {
  const url = MARKETING_ENDPOINTS.JOURNEY_RUNS(journeyId);
  try {
    const res = await fetch(url, {
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { runs: [], error: formatHttpDetail(json, `HTTP ${res.status}`) };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const rawRuns = Array.isArray(o.runs) ? o.runs : [];
    const runs: JourneyHistoryRun[] = rawRuns
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        id: String(x.id ?? ""),
        journey_id: String(x.journey_id ?? ""),
        tenant_id: String(x.tenant_id ?? ""),
        timestamp: String(x.timestamp ?? ""),
        status: String(x.status ?? ""),
        message: String(x.message ?? ""),
      }));
    return { runs, error: null };
  } catch (e) {
    return { runs: [], error: (e as Error)?.message ?? "Network error" };
  }
}

export async function deleteMarketingJourney(
  tenantId: string,
  journeyId: string
): Promise<JourneyMutationResult> {
  const url = MARKETING_ENDPOINTS.JOURNEY_BY_ID(journeyId);
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: authHeaders({ Accept: "application/json", "X-Tenant-ID": tenantId }),
    });
    const status = res.status;
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      return { ok: false, data: null, error: formatHttpDetail(json, `HTTP ${status}`), status };
    }
    const o = json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    return { ok: true, data: o, error: null, status };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error)?.message ?? "Network error", status: 0 };
  }
}

export async function fetchSocialStatus(tenantId: string) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(`/api/social/status/${tenantId}`, {
      headers: authHeaders({ "X-Tenant-ID": tenantId }),
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
  return `${BACKEND_URL}/auth/${platform}/connect/${tenantId}`;
}

export async function disconnectPlatform(platform: string, tenantId: string) {
  return fetch(`${BACKEND_URL}/auth/${platform}/disconnect/${tenantId}`, {
    method: "DELETE",
  });
}



