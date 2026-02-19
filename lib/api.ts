
// Status and Type exports
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "archived";
export type CampaignType = "email" | "sms" | "push" | "ads" | "newsletter" | "in-app" | "whatsapp" | "multi-channel";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nadakki-ai-suite.onrender.com";

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ABORT CONTROLLER SYSTEM
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MOCK DATA (fallback when backend unavailable)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const MOCK_ANALYTICS: AnalyticsOverview = {
  mau: { name: "MAU", value: 12450, current: 12450, change: 12, trend: "up" },
  dau: { name: "DAU", value: 3420, current: 3420, change: 8, trend: "up" },
  daily_sessions: { name: "Sessions", value: 8750, current: 8750, change: 5, trend: "up" },
  data_source: "mock",
  generated_at: new Date().toISOString(),
  total_users: 12450,
  active_users: 8234,
  total_campaigns: 47,
  active_campaigns: 12,
  total_revenue: { name: "Revenue", value: 125000, current: 125000, change: 8, trend: "up" },
  conversion_rate: 3.2,
  email_open_rate: 24.5,
  click_rate: 4.8,
  period: "30d",
  trend: { users: 12, campaigns: 5, revenue: 8 },
  top_campaigns: [
    { id: "1", name: "Summer Sale 2025", clicks: 15420, conversions: 892, revenue: 45000 },
    { id: "2", name: "Black Friday Early", clicks: 12300, conversions: 654, revenue: 32000 },
    { id: "3", name: "Newsletter Weekly", clicks: 8900, conversions: 234, revenue: 12000 },
  ],
  kpis: [
    { name: "MAU", value: 12450, target: 15000, unit: "users" },
    { name: "Conversion Rate", value: 3.2, target: 4.0, unit: "%" },
    { name: "Revenue", value: 125000, target: 150000, unit: "$" },
  ],
  time_series: [
    { date: "2025-12-01", sessions: 1200, users: 890, revenue: 4500, events: 3400 },
    { date: "2025-12-08", sessions: 1350, users: 920, revenue: 5200, events: 3800 },
    { date: "2025-12-15", sessions: 1100, users: 780, revenue: 3900, events: 3100 },
    { date: "2025-12-22", sessions: 1450, users: 1020, revenue: 6100, events: 4200 },
    { date: "2025-12-29", sessions: 1600, users: 1150, revenue: 7200, events: 4800 },
    { date: "2026-01-05", sessions: 1750, users: 1280, revenue: 8500, events: 5400 },
  ],
  funnel: [
    { stage: "Visitors", count: 50000, percentage: 100 },
    { stage: "Signups", count: 12450, percentage: 24.9 },
    { stage: "Activated", count: 8234, percentage: 16.5 },
    { stage: "Converted", count: 2450, percentage: 4.9 },
  ],
};

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Summer Sale 2025", status: "active", type: "email", created_at: "2025-12-01", updated_at: "2026-01-05", description: "Summer promotion campaign", subject: "Hot Summer Deals!", content: "<p>Check out our summer deals</p>", audience_size: 15000, stats: { sent: 15000, opened: 3675, clicked: 892, conversions: 234 } },
  { id: "2", name: "Black Friday Early", status: "active", type: "email", created_at: "2025-11-15", updated_at: "2026-01-03", description: "Early Black Friday deals", subject: "Black Friday Starts Now!", content: "<p>Early access to deals</p>", audience_size: 20000, stats: { sent: 20000, opened: 4900, clicked: 654, conversions: 189 } },
  { id: "3", name: "Newsletter Weekly", status: "active", type: "newsletter", created_at: "2025-10-01", updated_at: "2026-01-07", description: "Weekly newsletter", subject: "Your Weekly Update", content: "<p>Weekly news</p>", audience_size: 8000, stats: { sent: 8000, opened: 2160, clicked: 234, conversions: 67 } },
  { id: "4", name: "Product Launch", status: "draft", type: "email", created_at: "2026-01-01", updated_at: "2026-01-06", description: "New product launch", subject: "Introducing Our New Product", content: "<p>New product</p>", audience_size: 0, stats: { sent: 0, opened: 0, clicked: 0, conversions: 0 } },
  { id: "5", name: "Retargeting Q1", status: "paused", type: "ads", created_at: "2025-12-15", updated_at: "2026-01-02", description: "Q1 retargeting campaign", subject: "Come Back!", content: "<p>We miss you</p>", audience_size: 5000, stats: { sent: 5000, opened: 1250, clicked: 180, conversions: 45 } },
];

const MOCK_REALTIME = {
  active_users: 234,
  events_per_minute: 156,
  sessions_per_minute: 23,
  top_pages: [
    { page: "/dashboard", users: 89 },
    { page: "/campaigns", users: 45 },
    { page: "/analytics", users: 34 },
  ],
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TYPES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: "email" | "sms" | "push" | "ads" | "newsletter";
  created_at: string;
  updated_at: string;
  description?: string;
  subject?: string;
  content?: string;
  audience_size?: number;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    conversions: number;
  };
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FETCH WITH FALLBACK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// API MODULES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Analytics API
export const analyticsAPI = {
  getOverview: (tenantId: string = "default", period: string = "30d", signal?: AbortSignal): Promise<AnalyticsOverview> => 
    fetchWithFallback(`/api/analytics/overview?tenant=${tenantId}&period=${period}`, MOCK_ANALYTICS, { signal }),
  
  getMetrics: (tenantId: string = "default", signal?: AbortSignal): Promise<AnalyticsOverview> => 
    fetchWithFallback(`/api/analytics/metrics?tenant=${tenantId}`, MOCK_ANALYTICS, { signal }),
  
  getRealtime: (tenantId: string = "default", signal?: AbortSignal): Promise<RealtimeData> =>
    fetchWithFallback(`/api/analytics/realtime?tenant=${tenantId}`, MOCK_REALTIME, { signal }),
  
  getTimeSeries: (period: string = "30d", tenantId: string = "default", signal?: AbortSignal) =>
    fetchWithFallback(`/api/analytics/time-series?period=${period}&tenant=${tenantId}`, MOCK_ANALYTICS.time_series, { signal }),
  
  getPerformance: (metric: string, period: string = "30d", tenantId: string = "default", signal?: AbortSignal): Promise<PerformanceChartData[]> =>
    fetchWithFallback(`/api/analytics/performance?metric=${metric}&period=${period}&tenant=${tenantId}`, 
      MOCK_ANALYTICS.time_series || [], { signal }),
};

// Campaigns API
export const campaignsAPI = {
  getAll: (signal?: AbortSignal): Promise<Campaign[]> => 
    fetchWithFallback("/api/campaigns", MOCK_CAMPAIGNS, { signal }),
  
  getById: (id: string, signal?: AbortSignal): Promise<Campaign> => 
    fetchWithFallback(`/api/campaigns/${id}`, MOCK_CAMPAIGNS.find(c => c.id === id) || MOCK_CAMPAIGNS[0], { signal }),
  
  create: (data: Partial<Campaign>): Promise<Campaign> => 
    fetchWithFallback("/api/campaigns", { id: Date.now().toString(), ...data, status: "draft" } as Campaign, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: Partial<Campaign>): Promise<Campaign> => 
    fetchWithFallback(`/api/campaigns/${id}`, { id, ...data } as Campaign, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  delete: (id: string): Promise<{ success: boolean }> => 
    fetchWithFallback(`/api/campaigns/${id}`, { success: true }, { method: "DELETE" }),
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
  
  execute: (id: string, data: any) =>
    fetchWithFallback(`/api/agents/${id}/execute`, { success: true, result: {} }, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LEGACY EXPORTS (for backward compatibility)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
  executeAgent: (coreId: string, agentId: string, input: any): Promise<any> =>
    fetchWithFallback(`/api/cores/${coreId}/agents/${agentId}/execute`, {
      success: true,
      result: { message: "Agent executed successfully (mock)", input },
      timestamp: new Date().toISOString(),
    }, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  
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
