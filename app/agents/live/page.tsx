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
  return "";
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
  const [tenants, setTenants] = useState<
    Array<{ id?: string; slug: string; name?: string; display_name?: string }>
  >([]);
  const [tenantErr, setTenantErr] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [inputPayload, setInputPayload] = useState('{"query": "test"}');
  const [dryRun, setDryRun] = useState(true);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  useEffect(() => {
    setTenantIdState(getInitialTenant());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setTenantErr(null);
        const res = await fetch("/api/tenants", { cache: "no-store" });
        const text = await res.text().catch(() => "");
        if (!res.ok) {
          let msg = `HTTP ${res.status} ${res.statusText} | /api/tenants`;
          try {
            const body = text ? JSON.parse(text) : null;
            const detail = body?.error ?? body?.details ?? text.slice(0, 400);
            if (detail) msg += ` | ${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
          } catch {
            if (text) msg += ` | ${text.slice(0, 400)}`;
          }
          throw new Error(msg);
        }
        const json = text ? JSON.parse(text) : null;
        const list =
          json?.data?.tenants ?? json?.tenants ?? json?.data ?? json ?? [];
        const normalized = (Array.isArray(list) ? list : [])
          .map((t: any) => ({
            id: t.id,
            slug: String(t.slug ?? t.tenant_id ?? t.name ?? ""),
            name: t.name,
            display_name: t.display_name,
          }))
          .filter((t: any) => t.slug);
        if (!alive) return;
        setTenants(normalized);
        const preferred =
          normalized.find((t) => t.slug === "sfrentals")?.slug ??
          normalized.find((t) => t.slug === "sf-rentals-nadaki-excursions")?.slug ??
          normalized[0]?.slug ??
          "";
        if (preferred)
          setTenantIdState((prev) => prev || preferred);
      } catch (e: unknown) {
        if (!alive) return;
        setTenantErr(e instanceof Error ? e.message : String(e));
        setTenants([]);
      }
    })();
    return () => {
      alive = false;
    };
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
        const res = await fetch("/api/v1/agents/ids", {
          headers: { "X-Tenant-ID": tenantId, "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const txt = await res.text();
          if (process.env.NODE_ENV === "development") {
            console.debug("[Live] agents/ids", res.status, txt.slice(0, 300));
          }
          return;
        }
        const data = await res.json();
        const raw = (data?.data ?? data) as Record<string, string> | undefined;
        const map = raw && typeof raw === "object" ? raw : {};
        const executable: AgentOption[] = Object.entries(map).map(([name, id]) => ({
          id,
          name,
          execute_endpoint: `/api/v1/agents/${id}/execute`,
        }));
        setAgents(executable);
        if (executable.length > 0 && !selectedAgentId) {
          const preferred = executable.find((a: AgentOption) => a.id === DEFAULT_AGENT_ID);
          setSelectedAgentId(preferred?.id ?? executable[0].id);
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.debug("[Live] agents load error", e);
        }
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
    if (!selectedAgentId || !tenantId) return;
    const selectedSlug = String(tenantId).trim();
    if (!selectedSlug) {
      setTenantErr("Tenant required. Select a tenant before Execute.");
      return;
    }
    try {
      const raw = inputPayload.trim() ? JSON.parse(inputPayload) : {};
      const normalizedInput: Record<string, unknown> = (() => {
        if (raw && typeof raw === "object" && !Array.isArray(raw) && "input" in raw) {
          const val = (raw as Record<string, unknown>).input;
          return (val && typeof val === "object" && !Array.isArray(val)) ? (val as Record<string, unknown>) : { query: val };
        }
        if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length > 0) {
          return raw as Record<string, unknown>;
        }
        if (typeof raw === "string") {
          return { query: raw };
        }
        return (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};
      })();
      const { runId, streamUrl } = await obs.startRun(selectedAgentId, {
        input: normalizedInput,
        dryRun,
      });
      if (streamUrl) {
        obs.streamEvents(runId, streamUrl, () => {
          obs.getRun(runId);
          obs.loadRuns();
        });
      } else {
        obs.loadRuns();
      }
    } catch {
      /* error already set in obs */
    }
  }, [tenantId, selectedAgentId, inputPayload, dryRun, obs]);

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
            tenants={tenants}
            tenantErr={tenantErr}
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




