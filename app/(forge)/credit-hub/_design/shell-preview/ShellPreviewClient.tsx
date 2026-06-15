"use client";

import { useState } from "react";
import { ChAppShell, ChShellEmptyMain } from "@/components/credit-hub/shell/ChAppShell";
import {
  BulkActionBar,
  DecisionPanel,
  EmptyStateRich,
  EvidenceGrid,
  LoadingSkeleton,
  RiskBand,
  ScoreVisual,
  StepperWizard,
} from "@/components/credit-hub/primitives";
import type { PersonaType } from "@/lib/credit-hub/ch-types";

export function ShellPreviewClient() {
  const [persona, setPersona] = useState<PersonaType>("bank");
  const [bulkCount, setBulkCount] = useState(12);
  const [wizardStep, setWizardStep] = useState(2);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2 rounded-[var(--ch-r-lg)] border p-3"
        style={{ borderColor: "var(--ch-line)", background: "var(--ch-surface)" }}
      >
        <span className="text-sm font-medium" style={{ color: "var(--ch-text-2)" }}>
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
      </div>

      <div style={{ height: 720, border: "1px solid var(--ch-line)", borderRadius: "var(--ch-r-xl)", overflow: "hidden" }}>
        <ChAppShell persona={persona} trail={["Credit Hub", persona === "bank" ? "Bandeja" : "Solicitudes"]} frame multiTenant>
          <div className="space-y-8">
            <ChShellEmptyMain title="Package 0 — shell + primitivas" />

            <section className="space-y-3">
              <h2 className="ch-eyebrow">Primitives</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="ch-card p-4">
                  <ScoreVisual score={742} />
                </div>
                <div className="ch-card space-y-4 p-4">
                  <RiskBand level="low" />
                  <RiskBand level="medium" size="sm" />
                  <RiskBand level="high" size="lg" showDot={false} />
                  <RiskBand level="critical" />
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
              <EvidenceGrid />
              <DecisionPanel sticky />
            </div>

            <BulkActionBar count={bulkCount} onClear={() => setBulkCount(0)} />

            <StepperWizard current={wizardStep} errorStep={null} onStep={setWizardStep} />

            <EmptyStateRich variant="empty" />

            <section className="space-y-3">
              <h2 className="ch-eyebrow">Loading skeletons</h2>
              <LoadingSkeleton.KpiStrip />
              <LoadingSkeleton.Table rows={3} />
              <div className="grid gap-4 lg:grid-cols-2">
                <LoadingSkeleton.Detail />
                <LoadingSkeleton.Chart />
              </div>
            </section>
          </div>
        </ChAppShell>
      </div>
    </div>
  );
}
