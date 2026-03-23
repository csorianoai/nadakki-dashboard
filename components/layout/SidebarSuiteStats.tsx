"use client";

import { useFetchWithFallback } from "@/hooks/useFetchWithFallback";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";

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

function pickAgentTotal(h: Record<string, unknown>): number | null {
  if (typeof h.agents === "number") return h.agents;
  if (typeof h.total_agents === "number") return h.total_agents;
  if (typeof h.agent_count === "number") return h.agent_count;
  if (typeof h.agents_total === "number") return h.agents_total;
  if (typeof h.confirmed_agents === "number") return h.confirmed_agents;
  return null;
}

function pickWorkflowCount(h: Record<string, unknown>): number | string | null {
  if (typeof h.workflows === "number") return h.workflows;
  if (typeof h.workflow_count === "number") return h.workflow_count;
  return null;
}

export default function SidebarSuiteStats() {
  const { data: healthRaw, source: healthSource } = useFetchWithFallback<Record<string, unknown>>(
    MARKETING_ENDPOINTS.HEALTH,
    { fallbackData: {} }
  );

  const { data: coresRaw, source: coresSource } = useFetchWithFallback<unknown>(
    MARKETING_ENDPOINTS.CORES,
    { fallbackData: [] }
  );

  const healthData = unwrapData(healthRaw) as Record<string, unknown>;
  const agentNum = healthSource === "live" ? pickAgentTotal(healthData) : null;
  const agentsDisplay = agentNum ?? 0;

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
      <div style={{ textAlign: "center" }} title="GET /health">
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
