// lib/api/qa.ts - QA helpers using fetchAPI (X-Tenant-ID)
import { fetchAPI, API_BASE } from './base';
import { resolveExecutableAgentId } from './agents';

export interface AuthStatusMeta {
  connected?: boolean;
  [k: string]: unknown;
}

export interface AuthStatusResponse {
  meta?: AuthStatusMeta;
  google?: { connected?: boolean; [k: string]: unknown };
  [k: string]: unknown;
}

export async function getAuthMetaStatus(tenantId: string): Promise<AuthStatusResponse | null> {
  try {
    const r = await fetch(`${API_BASE}/auth/meta/status/${encodeURIComponent(tenantId)}`, {
      headers: { 'X-Tenant-ID': tenantId, Accept: 'application/json' },
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function getAuthGoogleStatus(tenantId: string): Promise<AuthStatusResponse | null> {
  try {
    const r = await fetch(`${API_BASE}/auth/google/status/${encodeURIComponent(tenantId)}`, {
      headers: { 'X-Tenant-ID': tenantId, Accept: 'application/json' },
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export interface AgentTestResult {
  success: boolean;
  dry_run?: boolean;
  agent_id?: string;
  result?: {
    decision?: { action?: string; confidence?: number; explanation?: string };
    business_impact_score?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export async function testAgentDryRun(
  agentKey: string,
  tenantId: string
): Promise<AgentTestResult> {
  const resolvedId = await resolveExecutableAgentId(agentKey, tenantId);
  const res = await fetchAPI<AgentTestResult>(`/api/v1/agents/${resolvedId}/execute`, {
    method: 'POST',
    tenantId,
    body: JSON.stringify({
      payload: { test: true },
      dry_run: true,
      live: false,
      auto_publish: false,
      auto_email: false,
    }),
  });
  return res as AgentTestResult;
}
