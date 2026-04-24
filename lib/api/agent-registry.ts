import { parseAgentRegistrySummary } from "@/lib/agent-registry/parse-summary";
import { SYSTEM_AGENT_REGISTRY } from "@/lib/api/endpoints";
import type { ParsedAgentRegistrySummary } from "@/types/agent-registry";

export const AGENT_REGISTRY_SUMMARY_PATH = SYSTEM_AGENT_REGISTRY.SUMMARY;

export type FetchAgentRegistrySummaryResult =
  | { ok: true; summary: ParsedAgentRegistrySummary; raw: unknown }
  | { ok: false; error: string };

/**
 * Fetches official agent registry summary. No numeric fallback on failure
 * (callers must show "Agent Registry unavailable").
 */
export async function fetchAgentRegistrySummary(
  init?: RequestInit
): Promise<FetchAgentRegistrySummaryResult> {
  try {
    const res = await fetch(AGENT_REGISTRY_SUMMARY_PATH, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...((init?.headers as Record<string, string> | undefined) ?? {}),
      },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const raw = await res.json();
    const summary = parseAgentRegistrySummary(raw);
    if (!summary) {
      return { ok: false, error: "Invalid summary payload" };
    }
    return { ok: true, summary, raw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
