"use client";

import { useAgents } from "@/app/hooks/useAgents";

export function SyncIndicator() {
  const hook: any = useAgents();

  const isLoading =
    hook?.isLoading ?? hook?.loading ?? hook?.isFetching ?? false;

  const payload = hook?.data ?? (Array.isArray(hook) ? hook : null);

  const agentCount =
    (Array.isArray(payload) ? payload.length : null) ??
    (Array.isArray(payload?.agents) ? payload.agents.length : null) ??
    (Array.isArray(payload?.data?.agents) ? payload.data.agents.length : null) ??
    (typeof payload?.totalAgents === "number" ? payload.totalAgents : null) ??
    (typeof payload?.data?.totalAgents === "number" ? payload.data.totalAgents : null) ??
    null;

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        Sincronizando...
      </div>
    );
  }

  return (
    <div className="text-sm text-green-600 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      ✅ {agentCount ?? "—"} agentes sincronizados
    </div>
  );
}
