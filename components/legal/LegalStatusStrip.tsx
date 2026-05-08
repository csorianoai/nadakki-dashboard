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
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 px-6 py-4 backdrop-blur-sm md:px-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_open_cases}</p>
          <p className="mt-1 text-base font-medium tabular-nums tracking-tight text-zinc-100">{count24h}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_pending_review}</p>
          <p className="mt-1 text-base font-medium tabular-nums tracking-tight text-zinc-100">{pendingReview}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_knowledge_pack}</p>
          <p className="mt-1 truncate text-base font-medium tracking-tight text-zinc-200">{kpLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.kpi_system}</p>
          <p className={`mt-1 text-base font-medium tracking-tight ${sysOk ? "text-emerald-400" : "text-amber-400"}`}>
            {health.loading ? "…" : sysOk ? m.kpi_ok : m.kpi_degraded}
          </p>
        </div>
      </div>
    </div>
  );
}
