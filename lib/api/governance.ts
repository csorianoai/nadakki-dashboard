/**
 * Cliente API del Nadakki Governance Core.
 * Same-origin en browser (dashboard proxy) para evitar CORS a Render.
 */

import { apiFetch, type ApiFetchInit } from "@/lib/api/fetch-client";
import type {
  GovernanceReport,
  GovernanceStatus,
  RunResponse,
} from "@/types/governance";

const GOVERNANCE_PREFIX = "/api/v1/governance";

/** Same-origin absoluto en browser; apiFetch no reescribe URLs https://. */
function governanceRequestUrl(path: string): string {
  const relative = `${GOVERNANCE_PREFIX}${path}`;
  if (typeof window !== "undefined") {
    return new URL(relative, window.location.origin).toString();
  }
  return relative;
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError" ||
    (err instanceof Error && err.name === "AbortError")
  );
}

function isNetworkFetchError(err: unknown): boolean {
  return err instanceof TypeError && /failed to fetch/i.test(err.message);
}

async function governanceApiFetch(path: string, init?: ApiFetchInit): Promise<Response> {
  try {
    return await apiFetch(governanceRequestUrl(path), init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    if (isNetworkFetchError(err)) {
      throw new Error(
        "Governance API: no se pudo conectar (usa el proxy same-origin del dashboard)",
      );
    }
    throw err;
  }
}

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
  const res = await governanceApiFetch(path, init);
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Governance API ${res.status}: ${detail || res.statusText}`);
  }
  return parseGovernanceJson<T>(res);
}

export const governanceApi = {
  async getStatus(signal?: AbortSignal): Promise<GovernanceStatus> {
    return governanceFetch<GovernanceStatus>("/status", { signal });
  },

  async runCheck(signal?: AbortSignal): Promise<RunResponse> {
    return governanceFetch<RunResponse>("/run", { method: "POST", signal });
  },

  async getReportById(auditId: string, signal?: AbortSignal): Promise<GovernanceReport> {
    return governanceFetch<GovernanceReport>(`/report/${encodeURIComponent(auditId)}`, { signal });
  },

  async getLatestReport(signal?: AbortSignal): Promise<GovernanceReport | null> {
    const res = await governanceApiFetch("/report/latest", { signal });
    if (res.status === 404) return null;
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new Error(`Governance API ${res.status}: ${detail || res.statusText}`);
    }
    return parseGovernanceJson<GovernanceReport>(res);
  },
};
