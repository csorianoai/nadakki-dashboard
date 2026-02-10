// lib/api/workflows.ts - Workflow Execution
import { fetchAPI } from './base';

export interface Workflow {
  id: string;
  name: string;
  version: string;
  tier: 'CORE' | 'EXECUTION' | 'INTELLIGENCE';
  agents: number;
  status: 'active' | 'inactive';
  description?: string;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
}

export interface WorkflowExecutionRequest {
  target_market?: string;
  industry_focus?: string[];
  leads_count?: number;
  budget?: number;
  campaign_brief?: {
    name: string;
    objective: string;
    channel: string;
  };
  [key: string]: any;
}

export interface WorkflowStep {
  step_id: string;
  step_order: number;
  step_name: string;
  agent: string;
  status: 'success' | 'failed' | 'skipped';
  duration_ms: number;
  input_hash: string;
  output_hash: string;
}

export interface WorkflowExecutionResponse {
  workflow_id: string;
  workflow_name: string;
  workflow_version: string;
  tenant_id: string;
  started_at: string;
  completed_at: string;
  status: 'success' | 'failed' | 'partial';
  steps: WorkflowStep[];
  decision: {
    decision: string;
    confidence: number;
    valid_until: string;
    business_impact: {
      roi: number;
      risk_score: number;
    };
  };
  summary: {
    steps_completed: string;
    steps_failed: number;
    total_duration_ms: number;
    average_confidence: number;
    pipeline_value: number;
  };
}

export const workflowsAPI = {
  getAll: () =>
    fetchAPI<WorkflowListResponse>('/workflows/'),
    
  getSchema: (workflowId: string) =>
    fetchAPI(`/workflows/${workflowId}/schema`),
    
  execute: (workflowId: string, params: WorkflowExecutionRequest) =>
    fetchAPI<WorkflowExecutionResponse>(`/workflows/${workflowId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    
  health: () =>
    fetchAPI('/workflows/health'),
};

export default workflowsAPI;
