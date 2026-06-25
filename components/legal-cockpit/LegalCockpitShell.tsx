"use client";

import type { LegalSystemStatus } from "@/lib/legal-cockpit/types";

interface Props {
  status: LegalSystemStatus;
  children: React.ReactNode;
}

export function LegalCockpitShell({ status, children }: Props) {
  return (
    <div className="space-y-5">
      {/* Status bar — integrado al layout legal existente */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-zinc-800/60">
        <span className="text-xs font-medium text-zinc-400 mr-1">Legal OS</span>
        {status.demoData && (
          <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-950/40 text-amber-400 border-amber-800/40">
            modo demo
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded border bg-emerald-950/40 text-emerald-400 border-emerald-800/40">
          {status.agentsSource === "backend"
            ? ${status.agentsCount} agentes activos
            : ${status.agentsCount} agentes demo}
        </span>
        <span className={	ext-[10px] px-2 py-0.5 rounded border }>
          RAG {status.ragStatus === "verified" ? "verificado" : "pendiente"}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded border bg-teal-950/40 text-teal-400 border-teal-800/40">
          {status.jurisdictions.join(" · ")}
        </span>
        <span className={	ext-[10px] px-2 py-0.5 rounded border }>
          Audit {status.auditTrailStatus === "on" ? "ON" : "pendiente"}
        </span>
      </div>
      {children}
    </div>
  );
}