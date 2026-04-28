"use client";

import { CreditAnalysisPanel } from "@/components/credit-hub/dealer/analysis/CreditAnalysisPanel";
import { ScoreVisual } from "@/components/credit-hub/dealer/analysis/ScoreVisual";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankReviewApplication, ComplianceReport, BankAuditTrail } from "@/lib/credit-hub/types/bankDecision";
import { BankAuditTimeline } from "./BankAuditTimeline";
import { BankComplianceCard } from "./BankComplianceCard";
import { BankDecisionPanel } from "./BankDecisionPanel";

export function BankDetailView({
  application,
  compliance,
  audit,
}: {
  application: BankReviewApplication;
  compliance?: ComplianceReport;
  audit?: BankAuditTrail;
}) {
  const payload = application.application_payload;
  const analysis = payload.analysis;
  const applicant = payload.applicant as Record<string, unknown> | undefined;
  const financial = payload.financial as Record<string, unknown> | undefined;
  const vehicle = payload.vehicle as Record<string, unknown> | undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        <ForgeCard>
          <h1 className="font-display text-3xl font-bold text-forge-text">{String(applicant?.full_name || "Cliente sin nombre")}</h1>
          <p className="mt-1 font-mono text-xs text-forge-text-muted">{application.application_id}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div><p className="text-xs text-forge-text-muted">Monto solicitado</p><p className="font-semibold text-forge-text">RD$ {Number(financial?.requested_amount || 0).toLocaleString("es-DO")}</p></div>
            <div><p className="text-xs text-forge-text-muted">Vehículo</p><p className="font-semibold text-forge-text">{String(vehicle?.make || "")} {String(vehicle?.model || "")}</p></div>
            <div><p className="text-xs text-forge-text-muted">Estado</p><p className="font-semibold text-forge-text">{application.state}</p></div>
          </div>
        </ForgeCard>
        {analysis && <ScoreVisual analysis={analysis} />}
        <CreditAnalysisPanel applicationId={application.application_id} />
      </div>
      <aside className="space-y-6">
        <BankComplianceCard report={compliance} />
        <BankDecisionPanel application={application} />
        <BankAuditTimeline audit={audit} />
      </aside>
    </div>
  );
}
