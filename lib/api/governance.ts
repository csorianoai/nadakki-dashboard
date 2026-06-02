/**
 * Cliente API del Nadakki Governance Core.
 * Reutiliza apiFetch() para auth headers y URLs same-origin / Render.
 */

import { apiFetch, type ApiFetchInit } from "@/lib/api/fetch-client";
import type {
  GovernanceReport,
  GovernanceStatus,
  RunResponse,
} from "@/types/governance";

const GOVERNANCE_PREFIX = "/api/v1/governance";

async function parseGovernanceJson<T>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Governance API: invalid JSON (${res.status})`);
  }
}

async function governanceFetch<T>(path: string, init?: ApiFetchInit): Promise<T> {
  const res = await apiFetch(`${GOVERNANCE_PREFIX}${path}`, init);
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Governance API ${res.status}: ${detail || res.statusText}`);
  }
  return parseGovernanceJson<T>(res);
}

export const governanceApi = {
  async getStatus(): Promise<GovernanceStatus> {
    return governanceFetch<GovernanceStatus>("/status");
  },

  async runCheck(): Promise<RunResponse> {
    return governanceFetch<RunResponse>("/run", { method: "POST" });
  },

  async getReportById(auditId: string): Promise<GovernanceReport> {
    return governanceFetch<GovernanceReport>(`/report/${encodeURIComponent(auditId)}`);
  },

  async getLatestReport(): Promise<GovernanceReport | null> {
    const res = await apiFetch(`${GOVERNANCE_PREFIX}/report/latest`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new Error(`Governance API ${res.status}: ${detail || res.statusText}`);
    }
    return parseGovernanceJson<GovernanceReport>(res);
  },
};
