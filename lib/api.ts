
// Status and Type exports
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";
export type CampaignType = "email" | "sms" | "push" | "ads" | "newsletter" | "in-app" | "whatsapp" | "multi-channel";
/** Same-origin; proxied via next.config rewrites / app/api */
const API_URL = "";

// ***************************************************************
// ABORT CONTROLLER SYSTEM
// ***************************************************************
const abortControllers = new Map<string, AbortController>();

export function getAbortController(key: string): AbortController {
  if (abortControllers.has(key)) {
    abortControllers.get(key)?.abort();
  }
  const controller = new AbortController();
  abortControllers.set(key, controller);
  return controller;
}

export function cancelAllRequests(): void {
  abortControllers.forEach((controller) => controller.abort());
  abortControllers.clear();
}

// ***************************************************************
// EMPTY FALLBACKS (returned when backend unavailable)
// ***************************************************************
const EMPTY_METRIC: MetricValue = { name: "", value: 0, current: 0, change: 0, trend: "neutral" };

const EMPTY_ANALYTICS: AnalyticsOverview = {
  mau: EMPTY_METRIC, dau: EMPTY_METRIC, daily_sessions: EMPTY_METRIC,
  data_source: "mock", generated_at: new Date().toISOString(),
  total_users: 0, active_users: 0, total_campaigns: 0, active_campaigns: 0,
  total_revenue: EMPTY_METRIC, conversion_rate: 0, email_open_rate: 0, click_rate: 0,
  period: "30d", trend: { users: 0, campaigns: 0, revenue: 0 },
  top_campaigns: [], kpis: [], time_series: [], funnel: [],
};

const EMPTY_REALTIME: RealtimeData = {
  active_users: 0, events_per_minute: 0, sessions_per_minute: 0, top_pages: [],
};

// ***************************************************************
// TYPES
// ***************************************************************
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: "email" | "sms" | "push" | "ads" | "newsletter" | "in-app" | "whatsapp" | "multi-channel";
  created_at: string;
  updated_at: string;
  description?: string;
  subject?: string;
  content?: string;
  audience_size?: number;
  /** Backend audience / segment id (cmp row). */
  audience_id?: string;
  /** Raw settings from campaigns_v2 (segment_id, template_id, snapshots, marketing_objective). */
  settings?: Record<string, unknown>;
  version?: number;
  created_by?: string;
  tenant_id?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    conversions: number;
  };
}

/** Normalize backend campaign response (metrics → stats, converted → conversions). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCampaign(raw: any): Campaign {
  const metrics = raw.metrics as Record<string, number> | undefined;
  const stats = raw.stats as Campaign["stats"] | undefined;
  return {
    ...raw,
    stats: stats ?? (metrics ? {
      sent: metrics.sent ?? 0,
      opened: metrics.opened ?? 0,
      clicked: metrics.clicked ?? 0,
      conversions: metrics.converted ?? metrics.conversions ?? 0,
    } : undefined),
  } as Campaign;
}

export interface AnalyticsOverview {
  // Metrics para MetricCard
  mau: MetricValue;
  dau: MetricValue;
  daily_sessions: MetricValue;
  total_users: number;
  active_users: number;
  total_campaigns: number;
  active_campaigns: number;
  total_revenue: MetricValue;
  conversion_rate: number;
  email_open_rate: number;
  click_rate: number;
  period: string;
  trend: { users: number; campaigns: number; revenue: number };
  top_campaigns: Array<{ id: string; name: string; clicks: number; conversions: number; revenue: number }>;
  kpis: Array<{ name: string; value: number; target: number; unit: string }>;
  time_series?: Array<{ date: string; sessions: number; users: number; revenue: number; events: number }>;
  funnel?: Array<{ stage: string; count: number; percentage: number }>;
  data_source?: "database" | "api" | "mock" | "cache";
  generated_at?: string;
  metrics?: MetricValue[];
  campaign_performance?: CampaignPerformance[];
}

export interface RealtimeData {
  active_users: number;
  events_per_minute: number;
  sessions_per_minute: number;
  top_pages: Array<{ page: string; users: number }>;
}

export interface PerformanceChartData {
  date: string;
  sessions: number;
  users: number;
  revenue: number;
  events: number;
}

export interface MetricValue {
  name: string;
  value: number;
  current: number;
  change: number;
  changeType?: "increase" | "decrease" | "neutral";
  trend: "up" | "down" | "neutral";
  unit?: string;
  previousValue?: number;
  previous?: number;
  target?: number;
  format?: "number" | "currency" | "percent";
}

export interface KPI {
  name: string;
  value: number;
  target: number;
  unit: string;
  progress?: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  roi?: number;
  status?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  core: string;
  status: "active" | "inactive" | "error";
  description?: string;
  config?: Record<string, any>;
}

// ***************************************************************
// FETCH WITH FALLBACK
// ***************************************************************
async function fetchWithFallback<T>(
  endpoint: string, 
  fallback: T, 
  options?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      console.warn(`API ${endpoint} returned ${response.status}, using fallback`);
      return fallback;
    }
    
    return await response.json();
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw error;
    }
    console.warn(`API ${endpoint} failed, using fallback:`, error);
    return fallback;
  }
}

// ***************************************************************
// API MODULES
// ***************************************************************

// Analytics API
export const analyticsAPI = {
  getOverview: (tenantId: string = "default", period: string = "30d", signal?: AbortSignal): Promise<AnalyticsOverview> => 
    fetchWithFallback(`/api/analytics/overview?tenant=${tenantId}&period=${period}`, EMPTY_ANALYTICS, { signal }),
  
  getMetrics: (tenantId: string = "default", signal?: AbortSignal): Promise<AnalyticsOverview> => 
    fetchWithFallback(`/api/analytics/metrics?tenant=${tenantId}`, EMPTY_ANALYTICS, { signal }),
  
  getRealtime: (tenantId: string = "default", signal?: AbortSignal): Promise<RealtimeData> =>
    fetchWithFallback(`/api/analytics/realtime?tenant=${tenantId}`, EMPTY_REALTIME, { signal }),
  
  getTimeSeries: (period: string = "30d", tenantId: string = "default", signal?: AbortSignal) =>
    fetchWithFallback(`/api/analytics/time-series?period=${period}&tenant=${tenantId}`, EMPTY_ANALYTICS.time_series, { signal }),
  
  getPerformance: (metric: string, period: string = "30d", tenantId: string = "default", signal?: AbortSignal): Promise<PerformanceChartData[]> =>
    fetchWithFallback(`/api/analytics/performance?metric=${metric}&period=${period}&tenant=${tenantId}`, 
      EMPTY_ANALYTICS.time_series || [], { signal }),
};

// Campaigns API — backend v2 at /campaigns (no /api prefix)
export const campaignsAPI = {
  getAll: async (signal?: AbortSignal, tenantId?: string): Promise<Campaign[]> => {
    const q = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const raw = await fetchWithFallback<Campaign[]>(`/campaigns${q}`, [] as Campaign[], { signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeCampaign);
  },

  getByStatus: async (status: CampaignStatus, signal?: AbortSignal, tenantId?: string): Promise<Campaign[]> => {
    const params = new URLSearchParams({ status });
    if (tenantId) params.set("tenant_id", tenantId);
    const raw = await fetchWithFallback<Campaign[]>(`/campaigns?${params}`, [], { signal });
    return (Array.isArray(raw) ? raw : []).map(normalizeCampaign);
  },

  getById: async (id: string, signal?: AbortSignal): Promise<Campaign> => {
    const raw = await fetchWithFallback(`/campaigns/${id}`, { id, name: "", status: "draft", type: "email", created_at: "", updated_at: "" } as Campaign, { signal });
    return normalizeCampaign(raw);
  },

  create: (data: Partial<Campaign>): Promise<Campaign> =>
    fetchWithFallback("/campaigns", { id: Date.now().toString(), ...data, status: "draft" } as Campaign, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Campaign>): Promise<Campaign> =>
    fetchWithFallback(`/campaigns/${id}`, { id, ...data } as Campaign, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetchWithFallback(`/campaigns/${id}`, { success: true }, { method: "DELETE" }),

  activate: (id: string): Promise<{ success: boolean }> =>
    fetchWithFallback(`/campaigns/${id}/activate`, { success: true }, { method: "POST" }),

  pause: (id: string): Promise<{ success: boolean }> =>
    fetchWithFallback(`/campaigns/${id}/pause`, { success: true }, { method: "POST" }),

  duplicate: (id: string): Promise<Campaign> =>
    fetchWithFallback(`/campaigns/${id}/duplicate`, {} as Campaign, { method: "POST" }),
};

// AI API
export const aiAPI = {
  generateTemplate: (data: { objective?: string; tone?: string; industry?: string; audience?: string }) => 
    fetchWithFallback("/api/ai/generate-template", {
      success: true,
      template: {
        subject: `${data.objective || "Campaign"} - Generated Template`,
        preview: "This is a preview of your AI-generated email template...",
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8b5cf6; margin-bottom: 20px;">Your AI-Generated Template</h1>
          <p style="color: #374151; line-height: 1.6;">This template was generated based on your specifications:</p>
          <ul style="color: #374151; line-height: 1.8;">
            <li><strong>Objective:</strong> ${data.objective || "General"}</li>
            <li><strong>Tone:</strong> ${data.tone || "Professional"}</li>
            <li><strong>Industry:</strong> ${data.industry || "Technology"}</li>
            <li><strong>Audience:</strong> ${data.audience || "General"}</li>
          </ul>
          <p style="color: #374151; line-height: 1.6; margin-top: 20px;">Customize this template to match your brand!</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="display: inline-block; padding: 14px 28px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Call to Action</a>
          </div>
        </div>`,
      }
    }, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  getStatus: () => 
    fetchWithFallback("/api/ai/status", { status: "available", model: "claude-3", fallback: true }),
};

// Agents API (for [core]/[agentId] pages)
export const agentsAPI = {
  getAll: (signal?: AbortSignal) =>
    fetchWithFallback("/api/agents", [], { signal }),
  
  getById: (id: string, signal?: AbortSignal) =>
    fetchWithFallback(`/api/agents/${id}`, { id, name: "Agent", status: "active" }, { signal }),
  
  execute: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/api/v1/agents/${id}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: data || {}, dry_run: false }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// ***************************************************************
// LEGACY EXPORTS (for backward compatibility)
// ***************************************************************
export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  ai: aiAPI,
  agents: agentsAPI,
  
  // Direct methods for legacy code
  get: <T>(endpoint: string, signal?: AbortSignal): Promise<T> =>
    fetchWithFallback(endpoint, {} as T, { signal }),
  
  post: <T>(endpoint: string, data: any): Promise<T> =>
    fetchWithFallback(endpoint, {} as T, { method: "POST", body: JSON.stringify(data) }),
  
  put: <T>(endpoint: string, data: any): Promise<T> =>
    fetchWithFallback(endpoint, {} as T, { method: "PUT", body: JSON.stringify(data) }),
  
  delete: <T>(endpoint: string): Promise<T> =>
    fetchWithFallback(endpoint, {} as T, { method: "DELETE" }),
  
  // Agent execution (for [core]/[agentId] pages)
  executeAgent: async (_coreId: string, agentId: string, input: any): Promise<any> => {
    const response = await fetch(`${API_URL}/api/v1/agents/${agentId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: input || {}, dry_run: false }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },
  
  // Get agent details
  getAgent: (coreId: string, agentId: string, signal?: AbortSignal): Promise<any> =>
    fetchWithFallback(`/api/cores/${coreId}/agents/${agentId}`, {
      id: agentId,
      core: coreId,
      name: `Agent ${agentId}`,
      status: "active",
      description: "AI Agent",
    }, { signal }),
};

// Default export
export default api;
