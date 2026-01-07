/**
 * API Layer for NADAKKI AI Suite
 * Enterprise-grade API client with abort controllers, error handling, and type safety
 * @version 2.1 - Complete with all endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

// ═══════════════════════════════════════════════════════════════
// ABORT CONTROLLER MANAGER
// ═══════════════════════════════════════════════════════════════

const abortControllers = new Map<string, AbortController>();

function getAbortController(key: string): AbortController {
  if (abortControllers.has(key)) {
    abortControllers.get(key)?.abort();
  }
  const controller = new AbortController();
  abortControllers.set(key, controller);
  return controller;
}

function clearAbortController(key: string): void {
  abortControllers.delete(key);
}

// ═══════════════════════════════════════════════════════════════
// GENERIC FETCH WRAPPER
// ═══════════════════════════════════════════════════════════════

interface FetchOptions extends RequestInit {
  abortKey?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const { abortKey, ...fetchOptions } = options;
  
  const controller = abortKey ? getAbortController(abortKey) : undefined;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller?.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    
    if (abortKey) {
      clearAbortController(abortKey);
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS TYPES
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

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS TYPES
// ═══════════════════════════════════════════════════════════════

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
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
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

// ═══════════════════════════════════════════════════════════════
// AI GENERATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface TemplateGenerationRequest {
  objective: string;
  channel: string;
  industry: string;
  tone: string;
  key_message: string;
  product_description?: string;
  cta?: string;
  additional_context?: string;
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
    apiFetch<AnalyticsOverview>(
      `/analytics/overview?tenant_id=${tenantId}&period=${period}`,
      { abortKey: `analytics-overview-${tenantId}` }
    ),
  
  getPerformance: (metric = 'sessions', period = '30d', tenantId = 'default') =>
    apiFetch<PerformanceChartData>(
      `/analytics/performance?metric=${metric}&period=${period}&tenant_id=${tenantId}`,
      { abortKey: `analytics-performance-${metric}` }
    ),
  
  getRealtime: (tenantId = 'default') =>
    apiFetch<any>(`/analytics/realtime?tenant_id=${tenantId}`),
  
  trackEvent: (tenantId: string, eventName: string, eventData: Record<string, any> = {}) =>
    apiFetch<any>(
      `/analytics/events?tenant_id=${tenantId}&event_name=${encodeURIComponent(eventName)}`,
      {
        method: 'POST',
        body: JSON.stringify(eventData),
      }
    ),
};

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS API
// ═══════════════════════════════════════════════════════════════

export const campaignsAPI = {
  list: (tenantId = 'default', status?: CampaignStatus, type?: CampaignType) => {
    let url = `/campaigns?tenant_id=${tenantId}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    return apiFetch<Campaign[]>(url, { abortKey: 'campaigns-list' });
  },
  
  get: (campaignId: string) =>
    apiFetch<Campaign>(`/campaigns/${campaignId}`),
  
  create: (campaign: CampaignCreate) =>
    apiFetch<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ ...campaign, tenant_id: campaign.tenant_id || 'default' }),
    }),
  
  update: (campaignId: string, updates: CampaignUpdate) =>
    apiFetch<Campaign>(`/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  saveDraft: (campaignId: string, content: Record<string, any>, tenantId = 'default') =>
    apiFetch<{ success: boolean; campaign_id: string; version: number; saved_at: string }>(
      `/campaigns/${campaignId}/save-draft`,
      {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: campaignId,
          content,
          auto_save: true,
          tenant_id: tenantId,
        }),
      }
    ),
  
  getDrafts: (campaignId: string) =>
    apiFetch<any[]>(`/campaigns/${campaignId}/drafts`),
  
  duplicate: (campaignId: string) =>
    apiFetch<Campaign>(`/campaigns/${campaignId}/duplicate`, { method: 'POST' }),
  
  delete: (campaignId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/campaigns/${campaignId}`, { method: 'DELETE' }),
  
  activate: (campaignId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/campaigns/${campaignId}/activate`, { method: 'POST' }),
  
  pause: (campaignId: string) =>
    apiFetch<{ success: boolean; status: string }>(`/campaigns/${campaignId}/pause`, { method: 'POST' }),
};

// ═══════════════════════════════════════════════════════════════
// AI GENERATION API
// ═══════════════════════════════════════════════════════════════

export const aiAPI = {
  getStatus: () =>
    apiFetch<AIStatus>('/ai/status'),
  
  generateTemplate: (request: TemplateGenerationRequest) =>
    apiFetch<GeneratedTemplate>('/ai/generate-template', {
      method: 'POST',
      body: JSON.stringify({ ...request, tenant_id: request.tenant_id || 'default' }),
    }),
  
  rewriteCopy: (originalText: string, targetTone: string, channel: string, maxLength?: number) =>
    apiFetch<any>('/ai/rewrite-copy', {
      method: 'POST',
      body: JSON.stringify({ original_text: originalText, target_tone: targetTone, channel, max_length: maxLength }),
    }),
  
  generateABVariants: (originalContent: Record<string, any>, variationType = 'subject', numVariants = 3) =>
    apiFetch<any[]>('/ai/ab-variants', {
      method: 'POST',
      body: JSON.stringify({ original_content: originalContent, variation_type: variationType, num_variants: numVariants }),
    }),
  
  optimizeSubject: (subject: string, channel = 'email', objective = 'convert') =>
    apiFetch<any>('/ai/optimize-subject', {
      method: 'POST',
      body: JSON.stringify({ subject, channel, objective }),
    }),
  
  personalize: (content: string, userData: Record<string, any>) =>
    apiFetch<any>('/ai/personalize', {
      method: 'POST',
      body: JSON.stringify({ content, user_data: userData }),
    }),
  
  getGenerations: (tenantId = 'default', limit = 20) =>
    apiFetch<any[]>(`/ai/generations?tenant_id=${tenantId}&limit=${limit}`),
};

// ═══════════════════════════════════════════════════════════════
// AGENTS API (for core agent execution)
// ═══════════════════════════════════════════════════════════════

export const agentsAPI = {
  list: (coreId?: string) => {
    const url = coreId ? `/marketing/agents?core=${coreId}` : '/marketing/agents';
    return apiFetch<any[]>(url);
  },
  
  get: (agentId: string) =>
    apiFetch<any>(`/marketing/agents/${agentId}`),
  
  execute: (coreId: string, agentId: string, input: Record<string, any>) =>
    apiFetch<any>(`/marketing/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ core: coreId, input }),
    }),
};

// Legacy function for backward compatibility
export async function executeAgent(coreId: string, agentId: string, input: Record<string, any>) {
  return agentsAPI.execute(coreId, agentId, input);
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function cancelAllRequests(): void {
  abortControllers.forEach((controller) => controller.abort());
  abortControllers.clear();
}

// Export unified API object
export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  ai: aiAPI,
  agents: agentsAPI,
  executeAgent,
  cancelAll: cancelAllRequests,
};

export default api;
