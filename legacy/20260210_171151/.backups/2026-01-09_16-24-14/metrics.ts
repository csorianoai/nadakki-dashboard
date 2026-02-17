// lib/api/metrics.ts - Dashboard Metrics V2
import { fetchAPI } from './base';

export interface DashboardMetrics {
  tenant_id: string;
  tenant_name: string;
  execution_boundary: string;
  plan: string;
  generated_at: string;
  usage: {
    decisions_used: number;
    decisions_limit: number;
  };
  metrics: {
    total_decisions: number;
    decisions_this_week: number;
    avg_confidence: number;
    total_pipeline: number;
    decision_distribution: Record<string, number>;
  };
  chain: {
    length: number;
    last_hash: string | null;
  };
  authority: {
    counts: {
      AI_AUTONOMOUS: number;
      AI_ASSISTED: number;
      HUMAN_IN_LOOP: number;
    };
    autonomy_rate: number;
  };
  insights: {
    top_reason: string;
    drift_alert: {
      detected: boolean;
      direction?: 'up' | 'down';
      magnitude?: number;
      message: string;
    };
    risk_indicators: Array<{
      type: string;
      severity: 'warning' | 'critical';
      value: number;
      message: string;
    }>;
  };
  recent_decisions: Array<{
    decision_id: string;
    action: string;
    confidence: number;
    pipeline: number;
  }>;
}

export interface ExecutiveSummary {
  tenant_id: string;
  summary: string;
  top_insight: string;
}

export const metricsAPI = {
  getDashboard: (tenantId: string) =>
    fetchAPI<DashboardMetrics>(`/dashboard-v2/${tenantId}/metrics`),
    
  getExecutiveSummary: (tenantId: string) =>
    fetchAPI<ExecutiveSummary>(`/dashboard-v2/${tenantId}/executive-summary`),
    
  getBasicMetrics: (tenantId: string) =>
    fetchAPI(`/dashboard/${tenantId}/metrics`),
};

export default metricsAPI;
