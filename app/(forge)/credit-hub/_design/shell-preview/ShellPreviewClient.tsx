"use client";

import { useState } from "react";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { ChBottomNav, ChSidebar } from "@/components/credit-hub/shell/ChSidebar";
import { ChTopbar } from "@/components/credit-hub/shell/ChTopbar";
import {
  BulkActionBar,
  ChartSkeleton,
  DecisionPanel,
  DetailSkeleton,
  EmptyStateRich,
  EvidenceGrid,
  KpiStripSkeleton,
  RiskBand,
  ScoreVisual,
  StepperWizard,
  TableSkeleton,
} from "@/components/credit-hub/primitives";
import type { DecisionState, PersonaType } from "@/lib/credit-hub/ch-types";

const WIZARD_STEPS = [
  { id: "applicant", label: "Solicitante" },
  { id: "vehicle", label: "Vehículo" },
  { id: "documents", label: "Documentos" },
  { id: "consent", label: "Consentimiento" },
];

const EVIDENCE = [
  {
    id: "score",
    title: "Puntaje y banda",
    body: "Score 742 · banda Aceptable · confianza del motor 82%.",
    sourceLabel: "forge_rule_based_v1",
    confidence: "high" as const,
  },
  {
    id: "dti",
    title: "Capacidad de pago",
    body: "DTI 28.4% · cuota estimada RD$18,400 · capacidad disponible RD$6,200.",
    sourceLabel: "metrics_block",
    confidence: "medium" as const,
  },
];

export function ShellPreviewClient() {
  const [persona, setPersona] = useState<PersonaType>("bank");
  const [decisionState, setDecisionState] = useState<DecisionState>("idle");
  const [bulkCount, setBulkCount] = useState(3);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-[var(--ch-r-lg)] border p-3" style={{ borderColor: "var(--ch-line)", background: "var(--ch-surface)" }}>
        <span className="text-sm font-medium" style={{ color: "var(--ch-ink-2)" }}>
          Persona preview
        </span>
        {(["bank", "dealer"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={p === persona ? "ch-btn ch-btn-primary" : "ch-btn ch-btn-secondary"}
            onClick={() => setPersona(p)}
          >
            {p === "bank" ? "Bank" : "Dealer"}
          </button>
        ))}
        <button type="button" className="ch-btn ch-btn-secondary" onClick={() => setDecisionState("loading")}>
          Decision loading
        </button>
        <button type="button" className="ch-btn ch-btn-secondary" onClick={() => setDecisionState("error")}>
          Decision error
        </button>
        <button type="button" className="ch-btn ch-btn-secondary" onClick={() => setDecisionState("idle")}>
          Decision idle
        </button>
      </div>

      <ChAppShell
        persona={persona}
        tenantName="CrediCefi Preview"
        sidebar={<ChSidebar persona={persona} activePath={persona === "bank" ? "/credit-hub/bank" : "/credit-hub/dealer"} institutionName="CrediCefi" />}
        bottomNav={<ChBottomNav persona={persona} activePath={persona === "bank" ? "/credit-hub/bank" : "/credit-hub/dealer"} />}
        topbar={
          <ChTopbar
            persona={persona}
            tenantName="CrediCefi Preview"
            breadcrumbs={[{ label: "Credit Hub", href: "/credit-hub" }, { label: "Package 0" }]}
            userInitials="CF"
          />
        }
      >
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="ch-eyebrow">Primitives</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="ch-card p-4">
                <ScoreVisual score={742} />
              </div>
              <div className="ch-card space-y-4 p-4">
                <RiskBand level="low" />
                <RiskBand level="medium" />
                <RiskBand level="high" />
                <RiskBand level="critical" />
              </div>
            </div>
          </section>

          <DecisionPanel state={decisionState} onApprove={() => setDecisionState("success")} onReject={() => setDecisionState("error")} onCounter={() => setDecisionState("conflict")} />

          <EvidenceGrid items={EVIDENCE} columns={2} />

          <BulkActionBar selectedCount={bulkCount} onClear={() => setBulkCount(0)} onApply={() => undefined} />

          <StepperWizard steps={WIZARD_STEPS} currentIndex={1} />

          <EmptyStateRich
            title="Bandeja al día"
            description="No hay solicitudes pendientes de revisión en este momento."
            tone="success"
            action={
              <button type="button" className="ch-btn ch-btn-primary">
                Ver analítica
              </button>
            }
          />

          <section className="space-y-3">
            <h2 className="ch-eyebrow">Loading skeletons</h2>
            <KpiStripSkeleton />
            <TableSkeleton rows={3} />
            <div className="grid gap-4 lg:grid-cols-2">
              <DetailSkeleton />
              <ChartSkeleton />
            </div>
          </section>
        </div>
      </ChAppShell>
    </div>
  );
}
