"use client";

import Link from "next/link";
import { useState } from "react";
import type { BankApplicationStipulation } from "@/lib/bank-application-detail/types";
import { isBankStipulationWorkflowUiEnabled } from "@/lib/env/bank-stipulation-workflow";
import { Button } from "@/components/ui/button";
import { BankWorkflowOrchestrationModal } from "@/components/bank/BankWorkflowOrchestrationModal";

export interface StipulationsPanelProps {
  applicationId: string;
  stipulations: BankApplicationStipulation[] | undefined;
  /** Tenant slug for META isolation in workflow overlay */
  tenantId?: string | null;
}

export function StipulationsPanel({ applicationId, stipulations, tenantId }: StipulationsPanelProps) {
  const rows = stipulations?.length ? stipulations : [];
  const workflowUi = isBankStipulationWorkflowUiEnabled();
  const [orchestrationOpen, setOrchestrationOpen] = useState(false);

  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="stips-section-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="stips-section-title" className="text-lg font-semibold text-forgeGray-900">
          Estipulaciones
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {workflowUi ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrchestrationOpen(true)}
              data-testid="open-stip-workflow-panel"
            >
              Flujo completo META
            </Button>
          ) : null}
          <Link
            href={`/bank/applications/${encodeURIComponent(applicationId)}/stipulations`}
            className="no-print text-forge-xs font-medium text-forgeBrand-700 hover:underline"
          >
            Gestionar →
          </Link>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-forge-sm text-forgeGray-600">Sin estipulaciones activas.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((s, i) => (
            <li
              key={s.id ?? `stip-${i}`}
              className="rounded-lg border border-forgeGray-100 bg-forgeGray-50/60 px-3 py-2 text-forge-sm text-forgeGray-900"
            >
              <span className="font-medium">{s.description ?? "Estipulación"}</span>
              {s.status ? (
                <span className="ml-2 text-forge-xs uppercase text-forgeGray-600">({s.status})</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {workflowUi ? (
        <BankWorkflowOrchestrationModal
          applicationId={applicationId}
          tenantId={tenantId}
          isOpen={orchestrationOpen}
          stipulationSeeds={stipulations}
          onClose={() => setOrchestrationOpen(false)}
        />
      ) : null}
    </section>
  );
}
