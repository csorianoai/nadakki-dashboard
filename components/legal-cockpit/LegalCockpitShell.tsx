"use client";

import type { LegalSystemStatus } from "@/lib/legal-cockpit/types";

interface Props {
  status: LegalSystemStatus;
  children: React.ReactNode;
}

export function LegalCockpitShell({ status, children }: Props) {
  return (
    <div className="w-full overflow-x-hidden min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-950 border border-violet-800
                              flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" className="text-violet-400">
                  <path d="M12 3L2 8l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-medium text-white leading-none">
                  Legal OS Cockpit
                </h1>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Nadakki AI Suite
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {status.demoData && (
                <span className="text-[10px] px-2 py-1 rounded border
                                 bg-amber-950/40 text-amber-400 border-amber-800/40">
                  modo demo
                </span>
              )}
              <span className="text-[10px] px-2 py-1 rounded border bg-emerald-950/40
                               text-emerald-400 border-emerald-800/40">
                {status.agentsSource === "backend"
                  ? `${status.agentsCount} agentes activos`
                  : `${status.agentsCount} agentes demo`}
              </span>
              <span className={`text-[10px] px-2 py-1 rounded border ${
                status.ragStatus === "verified"
                  ? "bg-violet-950/40 text-violet-400 border-violet-800/40"
                  : "bg-zinc-800/40 text-zinc-500 border-zinc-700/40"
              }`}>
                RAG {status.ragStatus === "verified" ? "verificado" : "pendiente"}
              </span>
              <span className="text-[10px] px-2 py-1 rounded border
                               bg-teal-950/40 text-teal-400 border-teal-800/40">
                {status.jurisdictions.join(" · ")}
              </span>
              <span className={`text-[10px] px-2 py-1 rounded border ${
                status.auditTrailStatus === "on"
                  ? "bg-blue-950/40 text-blue-400 border-blue-800/40"
                  : "bg-zinc-800/40 text-zinc-500 border-zinc-700/40"
              }`}>
                Audit {status.auditTrailStatus === "on" ? "ON" : "pendiente"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {children}
      </main>
    </div>
  );
}
