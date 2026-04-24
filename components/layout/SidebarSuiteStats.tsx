"use client";

import { useEffect, useState } from "react";
import { useAgentRegistrySummary } from "@/app/hooks/useAgentRegistrySummary";
import { fetchWithFallback, type FetchSource } from "@/lib/api/client";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";

const CACHE_KEY = "sidebar_stats";
const CACHE_TTL = 5 * 60 * 1000;

type SidebarStatsCache = {
  ts: number;
  healthRaw: Record<string, unknown>;
  healthSource: FetchSource;
  coresRaw: unknown;
  coresSource: FetchSource;
};

function unwrapData(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const o = json as Record<string, unknown>;
  if (o.data !== undefined && o.data !== null && typeof o.data === "object" && !Array.isArray(o.data)) {
    return { ...o, ...(o.data as Record<string, unknown>) };
  }
  return json;
}

function coresCount(json: unknown): number | null {
  const j = unwrapData(json);
  if (Array.isArray(j)) return j.length;
  if (j && typeof j === "object") {
    const o = j as Record<string, unknown>;
    if (Array.isArray(o.cores)) return o.cores.length;
    if (typeof o.total === "number") return o.total;
    if (typeof o.count === "number") return o.count;
  }
  return null;
}

function pickWorkflowCount(h: Record<string, unknown>): number | string | null {
  if (typeof h.workflows === "number") return h.workflows;
  if (typeof h.workflow_count === "number") return h.workflow_count;
  return null;
}

function readCache(): SidebarStatsCache | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SidebarStatsCache;
    if (typeof parsed?.ts !== "number") return null;
    if (Date.now() - parsed.ts >= CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: Omit<SidebarStatsCache, "ts">): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const payload: SidebarStatsCache = { ts: Date.now(), ...entry };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export default function SidebarSuiteStats() {
  const agentReg = useAgentRegistrySummary();
  const [healthRaw, setHealthRaw] = useState<Record<string, unknown>>({});
  const [healthSource, setHealthSource] = useState<FetchSource>("fallback");
  const [coresRaw, setCoresRaw] = useState<unknown>([]);
  const [coresSource, setCoresSource] = useState<FetchSource>("fallback");

  useEffect(() => {
    let cancelled = false;

    const cached = readCache();
    if (cached) {
      setHealthRaw(cached.healthRaw);
      setHealthSource(cached.healthSource);
      setCoresRaw(cached.coresRaw);
      setCoresSource(cached.coresSource);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const [healthRes, coresRes] = await Promise.all([
        fetchWithFallback<Record<string, unknown>>(MARKETING_ENDPOINTS.HEALTH, {
          fallbackData: {},
        }),
        fetchWithFallback<unknown>(MARKETING_ENDPOINTS.CORES, {
          fallbackData: [],
        }),
      ]);

      if (cancelled) return;

      setHealthRaw(healthRes.data);
      setHealthSource(healthRes.source);
      setCoresRaw(coresRes.data);
      setCoresSource(coresRes.source);

      writeCache({
        healthRaw: healthRes.data,
        healthSource: healthRes.source,
        coresRaw: coresRes.data,
        coresSource: coresRes.source,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const healthData = unwrapData(healthRaw) as Record<string, unknown>;

  const agentsDisplay = agentReg.loading
    ? "…"
    : agentReg.available && agentReg.summary
      ? String(agentReg.summary.displayCount)
      : "—";
  const agentsTitle = agentReg.tooltip;

  const cc = coresSource === "live" ? coresCount(coresRaw) : null;
  const coresDisplay = cc ?? (Array.isArray(coresRaw) ? coresRaw.length : 0);

  const wfNum = healthSource === "live" ? pickWorkflowCount(healthData) : null;
  const workflowsDisplay = wfNum ?? "—";

  const wfTitle = "Workflows disponibles cuando tracking esté activo";

  return (
    <div
      style={{
        padding: "8px 10px",
        margin: "10px",
        borderRadius: "8px",
        background: "rgba(139, 92, 246, 0.1)",
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      <div style={{ textAlign: "center" }} title={agentsTitle}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "#a78bfa",
          }}
        >
          {agentsDisplay}
        </div>
        <div style={{ fontSize: "7px", color: "#64748b" }}>AGENTES</div>
      </div>
      <div style={{ textAlign: "center" }} title="GET /cores">
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "#34d399",
          }}
        >
          {coresDisplay}
        </div>
        <div style={{ fontSize: "7px", color: "#64748b" }}>CORES</div>
      </div>
      <div style={{ textAlign: "center" }} title={wfTitle}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "#60a5fa",
          }}
        >
          {workflowsDisplay}
        </div>
        <div style={{ fontSize: "7px", color: "#64748b" }}>WORKFLOWS</div>
      </div>
    </div>
  );
}
