"use client";

import { Play } from "lucide-react";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import type { RunResponse, SnapshotPayload } from "../lib/types";
import { RunStatusBadge } from "./RunStatusBadge";
import { IntelligenceView } from "./IntelligenceView";

interface RunWorkspaceProps {
  run: RunResponse;
  snapshot: SnapshotPayload | null;
  starting: boolean;
  onStart: () => void;
}

function formatLabel(value: string): string {
  return value.replace(/_/g, " ");
}

export function RunWorkspace({ run, snapshot, starting, onStart }: RunWorkspaceProps) {
  const showStartCta = run.status === "draft" && !snapshot;
  const showResearchingWait = run.status === "researching" && !snapshot;

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <header className="flex flex-col gap-3 rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-forge-xl font-semibold text-forgeGray-800">
            {formatLabel(run.product)}
          </h2>
          <p className="mt-1 text-forge-sm text-forgeGray-500">
            {run.country_iso} · {formatLabel(run.vertical)} · {run.currency}
          </p>
        </div>
        <RunStatusBadge status={run.status} />
      </header>

      {showStartCta ? (
        <EmptyState
          title="Sin snapshot aún"
          description="Inicie la investigación para generar el snapshot de inteligencia de mercado."
          action={
            <button
              type="button"
              disabled={starting}
              onClick={onStart}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-forge-sm bg-[var(--mee-accent)] px-4 py-2 text-forge-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
            >
              <Play className="h-4 w-4" aria-hidden />
              {starting ? "Iniciando…" : "Iniciar investigación"}
            </button>
          }
        />
      ) : null}

      {showResearchingWait ? (
        <EmptyState
          title="Investigación en curso"
          description="El motor está recopilando fuentes. Actualice en unos momentos para ver el snapshot."
        />
      ) : null}

      {snapshot ? (
        <IntelligenceView snapshot={snapshot} currency={run.currency} />
      ) : null}
    </div>
  );
}
