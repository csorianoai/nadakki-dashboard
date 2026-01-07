/**
 * NADAKKI AI Suite - API Layer v3.0 (S-Tier)
 * Complete with AbortController, TypeSafe interfaces, Multi-tenant ready
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

// ═══════════════════════════════════════════════════════════════
// ABORT CONTROLLER SYSTEM
// ═══════════════════════════════════════════════════════════════

const abortControllers = new Map<string, AbortController>();
let globalControllers: AbortController[] = [];

function getAbortController(key: string): AbortController {
  if (abortControllers.has(key)) {
    abortControllers.get(key)?.abort();
  }
  const controller = new AbortController();
  abortControllers.set(key, controller);
  globalControllers.push(controller);
  return controller;
}

export function cancelAllRequests(): void {
  globalControllers.forEach(c => c.abort());
  globalControllers = [];
  abortControllers.clear();
}

// ═══════════════════════════════════════════════════════════════
// GENERIC FETCH WITH FULL ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

interface FetchOptions extends RequestInit {
  abortKey?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { abortKey, ...fetchOptions } = options;
  const controller = abortKey ? getAbortController(abortKey) : new AbortController();
  
  if (!abortKey) globalControllers.push(controller);

  try {
    const response = await fetch(API_BASE + endpoint, {
      ...fetchOptions,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error("API Error " + response.status + ": " + errorText);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    throw error;
  } finally {
    if (abortKey) abortControllers.delete(abortKey);
    globalControllers = globalControllers.filter(c => c !== controller);
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (ALIGNED WITH BACKEND)
// ═══════════════════════════════════════════════════════════════

export interface MetricValue {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  category: string;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  status: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
}

export interface AnalyticsOverview {
  tenant_id: string;
  period: string;
  generated_at: string;
  mau: MetricValue;
  dau: MetricValue;
  new_users: MetricValue;
  stickiness: MetricValue;
  daily_sessions: MetricValue;
  sessions_per_mau: MetricValue;
  active_campaigns: number;
  total_revenue: MetricValue;
  kpis: KPI[];
  top_campaigns: CampaignPerformance[];
  data_source?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface PerformanceChartData {
  metric: string;
  data: TimeSeriesPoint[];
  total: number;
  average: number;
}

export interface RealtimeData {
  active_users: number;
  sessions_per_minute: number;
  events_per_minute: number;
  top_pages: Array<{path: string; users: number}>;
  top_events: Array<{name: string; count: number}>;
  timestamp: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignType = 'email' | 'sms' | 'push' | 'in-app' | 'whatsapp' | 'multi-channel';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  description: string;
  subject: string | null;
  content: Record<string, any>;
  audience_id: string | null;
  audience_size: number;
  schedule: Record<string, any> | null;
  settings: Record<string, any>;
  version: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  metrics: { sent: number; delivered: number; opened: number; clicked: number; converted: number; };
}

export interface CampaignCreate {
  name: string;
  type: CampaignType;
  description?: string;
  subject?: string;
  content?: Record<string, any>;
  audience_id?: string;
  schedule?: Record<string, any>;
  settings?: Record<string, any>;
  tenant_id?: string;
}

export interface CampaignUpdate {
  name?: string;
  description?: string;
  subject?: string;
  content?: Record<string, any>;
  audience_id?: string;
  schedule?: Record<string, any>;
  settings?: Record<string, any>;
  status?: CampaignStatus;
}

export interface TemplateGenerationRequest {
  objective: string;
  channel: string;
  industry: string;
  tone: string;
  key_message: string;
  product_description?: string;
  cta?: string;
  tenant_id?: string;
}

export interface GeneratedTemplate {
  id: string;
  subject: string;
  preheader: string;
  headline: string;
  body: string;
  cta_text: string;
  cta_url: string;
  footer: string;
  metadata: {
    objective: string;
    channel: string;
    industry: string;
    tone: string;
    predicted_ctr: number;
    predicted_conversion: number;
    word_count: number;
    reading_time: string;
    ai_model: string;
    ai_enabled?: boolean;
    latency_ms?: number;
    confidence_score: number;
  };
  generated_at: string;
}

export interface AIStatus {
  ai_enabled: boolean;
  anthropic_configured: boolean;
  openai_configured: boolean;
  fallback_mode: boolean;
  model: string;
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS API
// ═══════════════════════════════════════════════════════════════

export const analyticsAPI = {
  getOverview: (tenantId = 'default', period = '30d') =>
    apiFetch<AnalyticsOverview>("/analytics/overview?tenant_id=" + tenantId + "&period=" + period, { abortKey: "analytics-overview" }),
  
  getPerformance: (metric = 'sessions', period = '30d', tenantId = 'default') =>
    apiFetch<PerformanceChartData>("/analytics/performance?metric=" + metric + "&period=" + period + "&tenant_id=" + tenantId, { abortKey: "analytics-perf-" + metric }),
  
  getRealtime: (tenantId = 'default') =>
    apiFetch<RealtimeData>("/analytics/realtime?tenant_id=" + tenantId),
  
  trackEvent: (tenantId: string, eventName: string, eventData: Record<string, any> = {}) =>
    apiFetch<any>("/analytics/events?tenant_id=" + tenantId + "&event_name=" + encodeURIComponent(eventName), {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
};

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS API
// ═══════════════════════════════════════════════════════════════

export const campaignsAPI = {
  list: (tenantId = 'default', status?: CampaignStatus, type?: CampaignType) => {
    let url = "/campaigns?tenant_id=" + tenantId;
    if (status) url += "&status=" + status;
    if (type) url += "&type=" + type;
    return apiFetch<Campaign[]>(url, { abortKey: 'campaigns-list' });
  },
  
  get: (campaignId: string) => apiFetch<Campaign>("/campaigns/" + campaignId),
  
  create: (campaign: CampaignCreate) =>
    apiFetch<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify({ ...campaign, tenant_id: campaign.tenant_id || 'default' }) }),
  
  update: (campaignId: string, updates: CampaignUpdate) =>
    apiFetch<Campaign>("/campaigns/" + campaignId, { method: 'PUT', body: JSON.stringify(updates) }),
  
  saveDraft: (campaignId: string, content: Record<string, any>, tenantId = 'default') =>
    apiFetch<{ success: boolean; campaign_id: string; version: number; saved_at: string }>(
      "/campaigns/" + campaignId + "/save-draft", { method: 'POST', body: JSON.stringify({ campaign_id: campaignId, content, auto_save: true, tenant_id: tenantId }) }),
  
  getDrafts: (campaignId: string) => apiFetch<any[]>("/campaigns/" + campaignId + "/drafts"),
  duplicate: (campaignId: string) => apiFetch<Campaign>("/campaigns/" + campaignId + "/duplicate", { method: 'POST' }),
  delete: (campaignId: string) => apiFetch<{ success: boolean }>("/campaigns/" + campaignId, { method: 'DELETE' }),
  activate: (campaignId: string) => apiFetch<{ success: boolean; status: string }>("/campaigns/" + campaignId + "/activate", { method: 'POST' }),
  pause: (campaignId: string) => apiFetch<{ success: boolean; status: string }>("/campaigns/" + campaignId + "/pause", { method: 'POST' }),
};

// ═══════════════════════════════════════════════════════════════
// AI GENERATION API
// ═══════════════════════════════════════════════════════════════

export const aiAPI = {
  getStatus: () => apiFetch<AIStatus>('/ai/status'),
  generateTemplate: (request: TemplateGenerationRequest) =>
    apiFetch<GeneratedTemplate>('/ai/generate-template', { method: 'POST', body: JSON.stringify({ ...request, tenant_id: request.tenant_id || 'default' }) }),
  getGenerations: (tenantId = 'default', limit = 20) => apiFetch<any[]>("/ai/generations?tenant_id=" + tenantId + "&limit=" + limit),
};

// ═══════════════════════════════════════════════════════════════
// AGENTS API (backward compatibility)
// ═══════════════════════════════════════════════════════════════

export const agentsAPI = {
  execute: (coreId: string, agentId: string, input: Record<string, any>) =>
    apiFetch<any>("/marketing/agents/" + agentId + "/execute", { method: 'POST', body: JSON.stringify({ core: coreId, input }) }),
};

export async function executeAgent(coreId: string, agentId: string, input: Record<string, any>) {
  return agentsAPI.execute(coreId, agentId, input);
}

// ═══════════════════════════════════════════════════════════════
// UNIFIED EXPORT
// ═══════════════════════════════════════════════════════════════

export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  ai: aiAPI,
  agents: agentsAPI,
  executeAgent,
  cancelAll: cancelAllRequests,
};

export default api;