// types/index.ts - Core type definitions

export interface Agent {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  version: string;
  superAgent: boolean;
  icon?: string;
  tags?: string[];
}

export interface Core {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  agentCount: number;
  agents: Agent[];
  status: 'active' | 'inactive' | 'maintenance';
}

export interface AgentExecutionRequest {
  input_data: Record<string, any>;
  tenant_id?: string;
}

export interface AgentExecutionResponse {
  status: 'success' | 'error';
  version: string;
  super_agent: boolean;
  business_impact_score: number;
  decision: {
    action: string;
    priority: string;
    confidence: number;
    explanation: string;
    next_steps: string[];
  };
  reason_codes: Array<{
    code: string;
    category: string;
    impact: string;
  }>;
  compliance_status: string;
  result?: Record<string, any>;
  error?: string;
}

export interface SystemMetrics {
  totalAgents: number;
  activeCores: number;
  uptime: string;
  avgLatency: number;
  successRate: number;
}

export type CoreId = 
  | 'marketing' | 'legal' | 'logistica' | 'contabilidad' 
  | 'presupuesto' | 'originacion' | 'rrhh' | 'educacion'
  | 'investigacion' | 'ventascrm' | 'regtech' | 'compliance'
  | 'decision' | 'experiencia' | 'fortaleza' | 'inteligencia'
  | 'operacional' | 'orchestration' | 'recuperacion' | 'vigilancia';
