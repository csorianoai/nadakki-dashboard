"use client";

import { useMemo } from "react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useLegalAuditTrail, useKnowledgePackStatus, useLegalHealth } from "@/hooks/useLegalCore";
import type { AuditTrailEntry } from "@/types/legal";

function entry24h(e: AuditTrailEntry): boolean {
  const t = new Date(e.timestamp).getTime();
  return Date.now() - t <= 24 * 60 * 60 * 1000;
}

type Props = { tenantId: string | undefined };

export function LegalStatusStrip({ tenantId }: Props) {
  const m = useLegalHomeMessages();
  const health = useLegalHealth(tenantId);
  const pack = useKnowledgePackStatus(tenantId);
  const audit = useLegalAuditTrail(tenantId, undefined, 80);

  const count24h = useMemo(
    () => (audit.entries ?? []).filter(entry24h).length,
    [audit.entries]
  );

  const pendingReview = useMemo(() => {
    return (audit.entries ?? []).filter((e) => {
      const r = String(e.output_metadata?.riesgo_legal ?? "").toLowerCase();
      return r === "high";
    }).length;
  }, [audit.entries]);

  const kpLabel = pack.data?.pack_hash?.slice(0, 12) ?? pack.data?.status ?? "do_v1";
  const sysOk = health.data?.status === "healthy" && !health.error;

  return (
    <div className="border-b border-forgeInk-200 bg-forgeSurface-sunken px-6 py-3 md:px-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-forge-text-subtle">{m.kpi_open_cases}</p>
          <p className="mt-1 text-forge-md font-semibold tabular-nums text-forge-text">{count24h}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-forge-text-subtle">{m.kpi_pending_review}</p>
          <p className="mt-1 text-forge-md font-semibold tabular-nums text-forge-text">{pendingReview}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-forge-text-subtle">{m.kpi_knowledge_pack}</p>
          <p className="mt-1 truncate text-forge-md font-semibold text-forge-text">{kpLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-forge-text-subtle">{m.kpi_system}</p>
          <p className={`mt-1 text-forge-md font-semibold ${sysOk ? "text-forge-success" : "text-forge-warning"}`}>
            {health.loading ? "…" : sysOk ? m.kpi_ok : m.kpi_degraded}
          </p>
        </div>
      </div>
    </div>
  );
}
