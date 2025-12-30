// lib/api/decisions.ts - Decision Logs + Hash Chain
import { fetchAPI } from './base';

export interface Decision {
  decision_id: string;
  workflow_id: string;
  workflow_name: string;
  workflow_version: string;
  tenant: {
    tenant_id: string;
    execution_boundary: string;
    plan: string;
  };
  decision: {
    action: string;
    confidence: number;
    priority: string;
    valid_until: string;
  };
  authority: {
    decision_mode: 'AI_AUTONOMOUS' | 'AI_ASSISTED' | 'HUMAN_IN_LOOP';
    approval_required: boolean;
    policy_id: string;
  };
  business_impact: {
    pipeline_value: number;
    risk_level: string;
    currency: string;
  };
  execution: {
    steps_completed: string;
    total_duration_ms: number;
    agents_executed: Array<{
      agent_id: string;
      agent_name: string;
      status: string;
      duration_ms: number;
    }>;
    source: string;
  };
  audit: {
    created_at: string;
    input_hash: string;
    output_hash: string;
    previous_decision_hash: string | null;
    chain_position: number;
    execution_boundary: string;
    request_id: string;
    // Preparado para futuro compliance
    chain_validated?: boolean;
    chain_validation_timestamp?: string;
  };
  compliance: {
    status: string;
    regulations_checked: string[];
    data_retention_days: number;
  };
}

export interface DecisionListResponse {
  tenant_id: string;
  execution_boundary: string;
  total: number;
  decisions: Decision[];
}

export interface DecisionStats {
  tenant_id: string;
  total_decisions: number;
  stats: {
    avg_confidence: number;
    total_pipeline: number;
    decision_distribution: Record<string, number>;
    chain_length: number;
    last_hash: string | null;
  };
}

export interface ChainVerification {
  tenant_id: string;
  valid: boolean;
  chain_length: number;
  last_hash: string | null;
  issues: Array<{ decision_id: string; issue: string }>;
  message: string;
}

export const decisionsAPI = {
  getAll: (tenantId: string, limit = 50) =>
    fetchAPI<DecisionListResponse>(`/decision-logs/${tenantId}?limit=${limit}`),
    
  getStats: (tenantId: string) =>
    fetchAPI<DecisionStats>(`/decision-logs/${tenantId}/stats`),
    
  verifyChain: (tenantId: string) =>
    fetchAPI<ChainVerification>(`/decision-logs/${tenantId}/verify-chain`),
    
  log: (tenantId: string, workflowResult: any) =>
    fetchAPI<{ success: boolean; decision_id: string; chain_position: number }>(
      `/decision-logs/${tenantId}/log`,
      {
        method: 'POST',
        body: JSON.stringify(workflowResult),
      }
    ),
};

export default decisionsAPI;
