"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchWithFallback } from "@/lib/api/client";
import { MARKETING_ENDPOINTS } from "@/lib/api/endpoints";

function coresCount(json: unknown): number | null {
  if (Array.isArray(json)) return json.length;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o.cores)) return o.cores.length;
    if (typeof o.total === "number") return o.total;
  }
  return null;
}

function pickAgentTotal(h: Record<string, unknown>): number | null {
  if (typeof h.agents_total === "number") return h.agents_total;
  if (typeof h.agents === "number") return h.agents;
  if (typeof h.confirmed_agents === "number") return h.confirmed_agents;
  return null;
}

export default function SidebarSuiteStats() {
  const { tenantId } = useTenant();
  const [agentsDisplay, setAgentsDisplay] = useState<string | number>("—");
  const [coresDisplay, setCoresDisplay] = useState<string | number>("—");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [hRes, cRes] = await Promise.all([
        fetchWithFallback<Record<string, unknown>>(MARKETING_ENDPOINTS.HEALTH, {
          tenantId: tenantId ?? undefined,
          fallbackData: {},
        }),
        fetchWithFallback<unknown>(MARKETING_ENDPOINTS.CORES, {
          tenantId: tenantId ?? undefined,
          fallbackData: {},
        }),
      ]);
      if (!alive) return;
      const agentNum =
        hRes.source === "live" ? pickAgentTotal(hRes.data) : null;
      setAgentsDisplay(agentNum ?? "—");
      const cc =
        cRes.source === "live" ? coresCount(cRes.data) : null;
      setCoresDisplay(cc ?? "—");
    })();
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const wfTitle = "Disponible cuando tracking esté activo";

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
          —
        </div>
        <div style={{ fontSize: "7px", color: "#64748b" }}>WORKFLOWS</div>
      </div>
    </div>
  );
}
