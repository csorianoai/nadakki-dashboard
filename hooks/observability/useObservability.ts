"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const EVENTS_CAP = 500;
const TERMINAL_TYPES = new Set(["done", "error", "run.canceled", "run.failed", "run.timeout", "stream.end"]);

export interface ObsEvent {
  ts?: string;
  type: string;
  severity?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface RunSummary {
  run_id: string;
  agent_id: string;
  mode: string;
  status: string;
  progress?: number;
  current_step?: string;
  created_at?: string;
  started_at?: string;
  ended_at?: string;
}

export interface UseObservabilityOptions {
  apiUrl: string;
  tenantId: string;
}

export function useObservability({ apiUrl, tenantId }: UseObservabilityOptions) {
  const [events, setEvents] = useState<ObsEvent[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [currentRun, setCurrentRun] = useState<RunSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const headers = useCallback((opts?: { sse?: boolean }) => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId || "credicefi",
      ...(opts?.sse ? { Accept: "text/event-stream" as const } : {}),
    };
    return h;
  }, [tenantId]);

  const base = apiUrl.replace(/\/$/, "");

  const loadRuns = useCallback(async () => {
    const tid = (tenantId ?? "").toString().trim();
    if (!tid || tid === "undefined") {
      setRuns([]);
      setError(null);
      if (process.env.NODE_ENV === "development") {
        console.debug("[Observability] loadRuns skipped: no tenantId");
      }
      return;
    }
    try {
      setError(null);
      const res = await fetch(`${base}/api/v1/tenants/${tid}/runs?limit=20`, { headers: headers({}) });
      if (!res.ok) {
        if (res.status === 400 || res.status === 404 || res.status === 500 || res.status === 503) {
          if (process.env.NODE_ENV === "development" && res.status === 400) {
            console.debug("[Observability] loadRuns", res.status, "for tenant", tid);
          }
          setRuns([]);
          return;
        }
        throw new Error(`loadRuns: ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data?.runs) ? data.runs : data?.data?.runs ?? [];
      setRuns(list);
    } catch {
      setRuns([]);
      /* Do not set error: keep banner for execution/SSE/cancel only; runs failure is non-blocking */
    }
  }, [base, tenantId, headers]);

  const startRun = useCallback(async (
    agentId: string,
    options: { mode?: string; input?: Record<string, unknown>; dryRun?: boolean } = {}
  ) => {
    setLoading(true);
    setError(null);
    setEvents([]);
    try {
      const inputData = options.input ?? {};
      const dryRun = options.dryRun !== false;
      const body: { payload: Record<string, unknown>; dry_run: boolean } = {
        payload: inputData,
        dry_run: dryRun,
      };
      const url = `${base}/api/v1/agents/${agentId}/execute`;
      if (process.env.NODE_ENV === "development") {
        console.debug("[Observability] startRun", { url, body, tenantId, agentId });
      }
      const res = await fetch(url, {
        method: "POST",
        headers: headers({}),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        if (process.env.NODE_ENV === "development") {
          console.debug("[Observability] startRun", res.status, base, tenantId, agentId, txt.slice(0, 400));
        }
        let detail = txt;
        try {
          const parsed = txt ? JSON.parse(txt) : null;
          detail = parsed?.error ?? parsed?.detail ?? parsed?.message ?? txt;
        } catch {
          /* use raw txt */
        }
        throw new Error(`startRun: ${res.status} ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
      }
      const data = await res.json();
      const runId = data.run_id || data.trace_id || `exec_${Date.now()}`;
      const streamUrl = data.stream_url ?? null;
      const status = data.status ?? (data.error ? "failed" : "succeeded");
      setCurrentRun({
        run_id: runId,
        agent_id: agentId,
        mode: data.mode ?? (dryRun ? "dry_run" : "live"),
        status,
        progress: data.progress ?? (status === "succeeded" ? 100 : 0),
        created_at: data.created_at,
      });
      if (!streamUrl && (status === "succeeded" || status === "failed")) {
        setEvents((prev) => [
          ...prev,
          {
            type: status === "succeeded" ? "done" : "run.failed",
            severity: status === "succeeded" ? "info" : "error",
            message: data.error ?? data.message ?? status,
            data: data.result ?? data.output ?? data,
          },
        ]);
      }
      return { runId, streamUrl };
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [base, tenantId, headers]);

  const streamEvents = useCallback((
    runId: string,
    streamPath: string,
    onTerminal?: () => void,
    lastEventId?: string
  ) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const url = streamPath.startsWith("http") ? streamPath : `${base}${streamPath}`;
    const h: Record<string, string> = { ...headers({ sse: true }) };
    if (lastEventId) h["Last-Event-ID"] = String(lastEventId);

    const runStream = (retry = false): Promise<void> =>
      new Promise((resolve) => {
        (async () => {
          try {
            const res = await fetch(url, { headers: h, signal: abortRef.current!.signal });
            if (!res.ok) {
              const txt = await res.text().catch(() => "");
              if (process.env.NODE_ENV === "development") {
                console.debug("[Observability] SSE", res.status, url, txt.slice(0, 200));
              }
              setError(`SSE: ${res.status}${txt ? ` " ${txt.slice(0, 150)}` : ""}`);
              onTerminal?.();
              resolve();
              return;
            }
            const reader = res.body?.getReader();
            if (!reader) {
              setError("No stream body");
              onTerminal?.();
              resolve();
              return;
            }
            const decoder = new TextDecoder();
            let buffer = "";
            let currentEvent = "message";
            let currentData = "";
            let lastSeq = lastEventId ? parseInt(lastEventId, 10) : 0;
            if (Number.isNaN(lastSeq)) lastSeq = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (line.startsWith("id: ")) {
                  const id = line.slice(4).trim();
                  if (/^\d+$/.test(id)) lastSeq = parseInt(id, 10);
                } else if (line.startsWith("event: ")) {
                  currentEvent = line.slice(7).trim();
                } else if (line.startsWith("data: ")) {
                  currentData += line.slice(6);
                } else if (line.trim() === "") {
                  if (currentData) {
                    try {
                      const parsed = JSON.parse(currentData) as ObsEvent;
                      setEvents((prev) => {
                        const next = [...prev, parsed].slice(-EVENTS_CAP);
                        return next;
                      });
                      if (TERMINAL_TYPES.has(currentEvent)) {
                        abortRef.current?.abort();
                        onTerminal?.();
                        resolve();
                        return;
                      }
                    } catch {
                      /* ignore parse errors */
                    }
                  }
                  currentEvent = "message";
                  currentData = "";
                }
              }
            }
            if (!retry && lastSeq > 0) {
              h["Last-Event-ID"] = String(lastSeq);
              await runStream(true);
            } else {
              onTerminal?.();
            }
            resolve();
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              setError((err as Error).message);
            }
            onTerminal?.();
            resolve();
          }
        })();
      });

    runStream();
  }, [base, headers]);

  const cancelRun = useCallback(async (runId: string) => {
    abortRef.current?.abort();
    try {
      const res = await fetch(`${base}/api/v1/runs/${runId}/cancel`, {
        method: "POST",
        headers: headers({}),
        body: JSON.stringify({ reason: "User requested", grace_period_ms: 0 }),
      });
      if (!res.ok) throw new Error(`cancelRun: ${res.status}`);
      await loadRuns();
    } catch (e) {
      setError((e as Error).message);
    }
  }, [base, headers, loadRuns]);

  const getRun = useCallback(async (runId: string) => {
    try {
      const res = await fetch(`${base}/api/v1/runs/${runId}`, { headers: headers({}) });
      if (!res.ok) throw new Error(`getRun: ${res.status}`);
      const data = await res.json();
      setCurrentRun(data);
      return data;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [base, headers]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return {
    events,
    runs,
    currentRun,
    loading,
    error,
    loadRuns,
    startRun,
    streamEvents,
    cancelRun,
    getRun,
    setCurrentRun,
  };
}
