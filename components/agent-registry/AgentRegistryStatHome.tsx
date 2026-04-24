"use client";

import { Loader2 } from "lucide-react";
import type { ParsedAgentRegistrySummary } from "@/types/agent-registry";

const UNAVAILABLE = "Agent Registry unavailable";

type Props = {
  loading: boolean;
  available: boolean;
  summary: ParsedAgentRegistrySummary | null;
  tooltip: string;
};

/** Home dashboard tile: count + "executable agents" / official + native tooltip breakdown. */
export function AgentRegistryStatHome({ loading, available, summary, tooltip }: Props) {
  if (loading) {
    return <Loader2 className="w-6 h-6 animate-spin text-gray-400" aria-label="Loading agent registry" />;
  }
  if (!available || !summary) {
    return (
      <div className="text-sm font-medium text-amber-400/95 leading-snug" title={tooltip}>
        {UNAVAILABLE}
      </div>
    );
  }
  const sub =
    summary.countKind === "executable"
      ? "executable agents"
      : "official total (registry)";
  return (
    <div title={tooltip} className="cursor-help">
      <div className="text-2xl font-bold text-white">{summary.displayCount}</div>
      <div className="text-xs text-gray-500 mt-0.5 leading-tight">{sub}</div>
    </div>
  );
}
