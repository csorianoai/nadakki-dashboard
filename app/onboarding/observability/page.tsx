"use client";

/**
 * Onboarding → Agent Observability (tipo Manus)
 * Ver ejecuciones (runs), logs live (SSE), ejecutar dry_run, cancelar.
 *
 * Config: set NEXT_PUBLIC_NADAKKI_API_BASE in .env.local
 * Ej: NEXT_PUBLIC_NADAKKI_API_BASE=http://127.0.0.1:8000
 * O para Render: https://nadakki-ai-suite.onrender.com
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  Play,
  Square,
  RefreshCw,
  Activity,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useToast } from "@/components/ui/Toast";
import { parseSSEStream } from "@/lib/observability/sse-fetch";

const API_BASE =
  process.env.NEXT_PUBLIC_NADAKKI_API_BASE || "http://127.0.0.1:8000";
const TENANT_HEADER = "X-Tenant-ID";
const STORAGE_KEY = "lastInstitution";
const RECONNECT_BACKOFFS = [1000, 2000, 4000];
const MAX_RECONNECT_ATTEMPTS = 3;

type RunStatus = "IDLE" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";

interface Run {
  run_id: string;
  status: string;
  agent_id?: string;
  created_at: string;
}

interface IdsMap {
  [shortKey: string]: string;
}

function getTenantFromStorage(): string {
  if (typeof window === "undefined") return "demo";
  return localStorage.getItem(STORAGE_KEY) || "demo";
}

function setTenantInStorage(val: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, val);
  } catch {
    /* ignore */
  }
}

export default function ObservabilityPage() {
  const toast = useToast();
  const [tenant, setTenantState] = useState("demo");
  const [tenantInput, setTenantInput] = useState("demo");
  const [idsMap, setIdsMap] = useState<IdsMap>({});
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [logs, setLogs] = useState<Array<{ ts: string; msg: string }>>([]);
  const [status, setStatus] = useState<RunStatus>("IDLE");
  const [runId, setRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const setTenant = useCallback((val: string) => {
    setTenantState(val);
    setTenantInput(val);
    setTenantInStorage(val);
  }, []);

  const headers = useCallback(
    () => ({ [TENANT_HEADER]: tenant }),
    [tenant]
  );

  const loadAgents = useCallback(async () => {
    setLoadingAgents(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/agents/ids`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const map = (data?.data ?? data) as IdsMap;
      if (map && typeof map === "object") {
        setIdsMap(map);
        const keys = Object.keys(map);
        if (keys.length && !keys.includes(selectedAgent)) {
          setSelectedAgent(keys[0]);
        }
      } else {
        setIdsMap({});
      }
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      setError(msg);
      toast.error("Load Agents", msg);
      setIdsMap({});
    } finally {
      setLoadingAgents(false);
    }
  }, [tenant, headers, selectedAgent, toast]);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/tenants/${encodeURIComponent(tenant)}/runs?limit=25`,
        { headers: headers() }
      );
      if (!res.ok) {
        setRuns([]);
        return;
      }
      const data = await res.json();
      const list = data?.runs ?? data?.data ?? data ?? [];
      setRuns(Array.isArray(list) ? list : []);
    } catch {
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }, [tenant, headers]);

  useEffect(() => {
    setTenantState(getTenantFromStorage());
    setTenantInput(getTenantFromStorage());
  }, []);

  useEffect(() => {
    const id = setInterval(loadRuns, 5000);
    loadRuns();
    return () => clearInterval(id);
  }, [loadRuns]);

  const appendLog = useCallback((msg: string) => {
    setLogs((prev) => [
      ...prev,
      { ts: new Date().toLocaleTimeString(), msg },
    ]);
  }, []);

  const cleanupStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }
  }, []);

  const connectSSE_OptionA = useCallback(
    (streamUrl: string, runIdVal: string) => {
      cleanupStream();
      let lastEventId = "";
      let attempt = 0;

      const connect = () => {
        const url =
          streamUrl.startsWith("http") || streamUrl.startsWith("//")
            ? streamUrl
            : `${API_BASE}${streamUrl.startsWith("/") ? "" : "/"}${streamUrl}`;
        const withId = lastEventId
          ? `${url}${url.includes("?") ? "&" : "?"}lastEventId=${encodeURIComponent(lastEventId)}`
          : url;

        const es = new EventSource(withId);
        eventSourceRef.current = es;

        es.onmessage = (e) => {
          lastEventId = e.lastEventId || lastEventId;
          appendLog(e.data ?? "");
        };
        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          if (attempt < MAX_RECONNECT_ATTEMPTS) {
            const delay =
              RECONNECT_BACKOFFS[Math.min(attempt, RECONNECT_BACKOFFS.length - 1)];
            attempt++;
            setTimeout(connect, delay);
          } else {
            appendLog("[SSE] Reconnection limit reached");
          }
        };
      };
      connect();
    },
    [appendLog, cleanupStream]
  );

  const connectSSE_OptionB = useCallback(
    (runIdVal: string) => {
      cleanupStream();
      const url = `${API_BASE}/api/v1/runs/${encodeURIComponent(runIdVal)}/stream`;
      const ctrl = new AbortController();
      fetchAbortRef.current = ctrl;

      parseSSEStream(
        url,
        { signal: ctrl.signal, headers: headers() },
        {
          onMessage: (data) => appendLog(data),
          onError: (err) => appendLog(`[SSE error] ${err.message}`),
          onDone: () => {},
        }
      );
    },
    [appendLog, cleanupStream, headers]
  );

  const handleRun = useCallback(async () => {
    const agentId = idsMap[selectedAgent] ?? selectedAgent;
    if (!agentId) {
      toast.warning("Run", "Selecciona un agente");
      return;
    }
    setRunning(true);
    setError(null);
    setLogs([]);
    setStatus("RUNNING");
    setRunId(null);
    cleanupStream();

    try {
      const res = await fetch(`${API_BASE}/agents/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          agent_id: agentId,
          tenant_id: tenant,
          mode: "dry_run",
          payload: {},
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const rid = data.run_id ?? data.runId ?? null;
      const streamUrl = data.stream_url ?? data.streamUrl ?? null;

      if (rid) {
        setRunId(rid);
        appendLog(`Run started: ${rid}`);
        loadRuns();

        if (streamUrl) {
          connectSSE_OptionA(streamUrl, rid);
        } else {
          connectSSE_OptionB(rid);
        }
      } else {
        appendLog(JSON.stringify(data, null, 2));
        setStatus("SUCCEEDED");
      }
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      setError(msg);
      setStatus("FAILED");
      appendLog(`[Error] ${msg}`);
      toast.error("Run", msg);
    } finally {
      setRunning(false);
    }
  }, [
    selectedAgent,
    idsMap,
    tenant,
    headers,
    loadRuns,
    appendLog,
    connectSSE_OptionA,
    connectSSE_OptionB,
    cleanupStream,
    toast,
  ]);

  const handleCancel = useCallback(async () => {
    if (!runId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/runs/${encodeURIComponent(runId)}/cancel`,
        { method: "POST", headers: headers() }
      );
      if (res.ok) {
        appendLog("Cancel request sent");
        setStatus("CANCELED");
        cleanupStream();
        setRunId(null);
        loadRuns();
      } else {
        toast.error("Cancel", `HTTP ${res.status}`);
      }
    } catch (e) {
      toast.error("Cancel", String((e as Error)?.message ?? e));
    }
  }, [runId, headers, appendLog, cleanupStream, loadRuns, toast]);

  const selectRun = useCallback(
    (rid: string) => {
      setRunId(rid);
      setLogs([{ ts: new Date().toLocaleTimeString(), msg: `Viewing run: ${rid}` }]);
      setStatus("IDLE");
      cleanupStream();
      connectSSE_OptionB(rid);
    },
    [connectSSE_OptionB, cleanupStream]
  );

  useEffect(() => {
    return () => cleanupStream();
  }, [cleanupStream]);

  const agentKeys = Object.keys(idsMap);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/">
        <span className="text-sm text-gray-400">Observability</span>
      </NavigationBar>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Onboarding
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Observability</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Agent Observability (Manus-style)
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Ver ejecuciones y logs live vía SSE
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Controls */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Tenant</label>
            <input
              type="text"
              value={tenantInput}
              onChange={(e) => setTenantInput(e.target.value)}
              onBlur={() => tenantInput && setTenant(tenantInput)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white w-32"
              placeholder="demo"
            />
          </div>
          <button
            onClick={loadAgents}
            disabled={loadingAgents}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
          >
            {loadingAgents ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Load Agents
          </button>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white min-w-[200px]"
            >
              <option value="">—</option>
              {agentKeys.map((key) => (
                <option key={key} value={key}>
                  {key} → {idsMap[key]?.slice(0, 12)}…
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRun}
            disabled={running || !selectedAgent}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run (dry_run)
          </button>
          <button
            onClick={handleCancel}
            disabled={!runId || status === "CANCELED"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </GlassCard>

      {/* Status + Run ID */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span
            className={`px-2 py-0.5 rounded text-sm font-medium ${
              status === "RUNNING"
                ? "bg-amber-500/20 text-amber-400"
                : status === "SUCCEEDED"
                  ? "bg-green-500/20 text-green-400"
                  : status === "FAILED" || status === "CANCELED"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {status}
          </span>
        </div>
        {runId && (
          <span className="text-sm text-gray-400 font-mono truncate max-w-xs">
            run_id: {runId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runs table */}
        <GlassCard className="overflow-hidden">
          <div className="p-4 border-b border-white/10 font-medium text-white">
            Runs recientes
          </div>
          <div className="max-h-80 overflow-auto">
            {loadingRuns ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : runs.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm">No hay runs</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="p-3">Run ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr
                      key={r.run_id}
                      onClick={() => selectRun(r.run_id)}
                      className={`border-t border-white/5 hover:bg-white/5 cursor-pointer ${
                        runId === r.run_id ? "bg-purple-500/10" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-xs truncate max-w-[120px]">
                        {r.run_id}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs ${
                            r.status === "running"
                              ? "bg-amber-500/20 text-amber-400"
                              : r.status === "done"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs truncate max-w-[100px]">
                        {r.agent_id ?? "—"}
                      </td>
                      <td className="p-3 text-gray-400">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>

        {/* Live Console */}
        <GlassCard className="overflow-hidden">
          <div className="p-4 border-b border-white/10 font-medium text-white">
            Live Console
          </div>
          <div className="p-4">
            <pre className="font-mono text-xs bg-black/30 rounded-lg p-4 max-h-80 overflow-auto text-gray-300 whitespace-pre-wrap break-all">
              {logs.length === 0
                ? "Selecciona un run o ejecuta uno nuevo."
                : logs.map((l, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-gray-500">[{l.ts}]</span> {l.msg}
                    </div>
                  ))}
            </pre>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
