"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useObservability } from "@/hooks/observability";
import {
  AgentRunner,
  ExecutionView,
  RunHistory,
} from "@/components/live-panel";

const LIVE_TENANT_KEY = "nadakki_live_tenant";
const DEFAULT_TENANT = "credicefi";
const DEFAULT_AGENT_ID = "abtestingia__abtestingagentoperative";

function getApiUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8000";
  return (
    process.env.NEXT_PUBLIC_RENDER_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000"
  );
}

function getInitialTenant(): string {
  if (typeof window === "undefined") return DEFAULT_TENANT;
  try {
    const v = localStorage.getItem(LIVE_TENANT_KEY);
    return v ?? DEFAULT_TENANT;
  } catch {
    return DEFAULT_TENANT;
  }
}

interface AgentOption {
  id: string;
  name?: string;
  execute_endpoint?: string | null;
}

export default function LivePanelPage() {
  const [tenantId, setTenantIdState] = useState(DEFAULT_TENANT);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [inputPayload, setInputPayload] = useState('{"query": "test"}');
  const [dryRun, setDryRun] = useState(true);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    setTenantIdState(getInitialTenant());
  }, []);

  const persistTenant = useCallback((v: string) => {
    setTenantIdState(v);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LIVE_TENANT_KEY, v);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const apiUrl = getApiUrl();
  const obs = useObservability({ apiUrl, tenantId });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = async () => {
      setLoadingAgents(true);
      try {
        const res = await fetch(`/api/ai-studio/agents?limit=200`, {
          headers: { "X-Tenant-ID": tenantId },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data?.agents ?? data?.agents ?? [];
        const executable = list.filter((a: AgentOption) => a.execute_endpoint != null);
        setAgents(executable);
        if (executable.length > 0 && !selectedAgentId) {
          const preferred = executable.find((a: AgentOption) => a.id === DEFAULT_AGENT_ID);
          setSelectedAgentId(preferred?.id ?? executable[0].id);
        }
      } catch {
        setAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };
    load();
  }, [tenantId, selectedAgentId]);

  useEffect(() => {
    obs.loadRuns();
  }, [tenantId, obs.loadRuns]);

  const handleExecute = useCallback(async () => {
    if (!selectedAgentId) return;
    try {
      const input = inputPayload.trim() ? JSON.parse(inputPayload) : {};
      const { runId, streamUrl } = await obs.startRun(selectedAgentId, {
        mode: "dry_run",
        input,
        dryRun,
      });
      obs.streamEvents(runId, streamUrl, () => {
        obs.getRun(runId);
        obs.loadRuns();
      });
    } catch {
      /* error already set in obs */
    }
  }, [selectedAgentId, inputPayload, dryRun, obs]);

  const handleCancel = useCallback(async () => {
    const run = obs.currentRun;
    if (!run?.run_id) return;
    await obs.cancelRun(run.run_id);
  }, [obs]);

  const terminalStatuses = new Set(["succeeded", "failed", "canceled", "timeout"]);
  useEffect(() => {
    if (obs.currentRun?.status && terminalStatuses.has(obs.currentRun.status)) {
      obs.loadRuns();
    }
  }, [obs.currentRun?.status]);

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-800 text-slate-100 m-0">Agent Live Panel</h1>
          <p className="text-slate-400 mt-2">
            Execute agents with real-time SSE streaming &middot;{" "}
            <Link href="/agents/execute" className="text-cyan-500 hover:underline">
              Execute Console
            </Link>
          </p>
        </div>
      </div>

      {obs.error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {obs.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <AgentRunner
            tenantId={tenantId}
            onTenantChange={persistTenant}
            agents={agents}
            loadingAgents={loadingAgents}
            selectedAgentId={selectedAgentId}
            onAgentChange={setSelectedAgentId}
            inputPayload={inputPayload}
            onInputChange={setInputPayload}
            dryRun={dryRun}
            onDryRunChange={setDryRun}
            onExecute={handleExecute}
            onCancel={handleCancel}
            executing={
              obs.currentRun != null &&
              !["succeeded", "failed", "canceled", "timeout"].includes(obs.currentRun.status ?? "")
            }
            runId={obs.currentRun?.run_id ?? null}
            status={obs.currentRun?.status ?? null}
          />
        </div>

        <div className="lg:col-span-5">
          <ExecutionView
            events={obs.events}
            currentStep={obs.currentRun?.current_step ?? null}
            status={obs.currentRun?.status ?? null}
          />
        </div>

        <div className="lg:col-span-4">
          <RunHistory
            runs={obs.runs}
            loading={false}
            onRefresh={obs.loadRuns}
          />
        </div>
      </div>
    </div>
  );
}




