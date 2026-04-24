"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAgentRegistrySummary } from "@/lib/api/agent-registry";
import { buildAgentRegistryTooltip } from "@/lib/agent-registry/parse-summary";
import type { ParsedAgentRegistrySummary } from "@/types/agent-registry";

export type AgentRegistrySummaryState = {
  loading: boolean;
  /** true when summary loaded successfully */
  available: boolean;
  summary: ParsedAgentRegistrySummary | null;
  error: string | null;
  tooltip: string;
  refresh: () => Promise<void>;
};

export function useAgentRegistrySummary(): AgentRegistrySummaryState {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [summary, setSummary] = useState<ParsedAgentRegistrySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAgentRegistrySummary();
    if (result.ok) {
      setSummary(result.summary);
      setAvailable(true);
    } else {
      setSummary(null);
      setAvailable(false);
      setError("error" in result ? result.error : "Unknown error");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tooltip =
    available && summary
      ? buildAgentRegistryTooltip(summary)
      : error
        ? `Agent Registry unavailable\n${error}`
        : "Agent Registry unavailable";

  return {
    loading,
    available,
    summary,
    error,
    tooltip,
    refresh: load,
  };
}
