"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Download, FileText } from "lucide-react";
import { DecisionPanel, DetailSkeleton, RiskBand, ScoreVisual } from "@/components/credit-hub/primitives";
import { AnalysisTab } from "@/components/credit-hub/bank/sections/AnalysisTab";
import { AuditTab } from "@/components/credit-hub/bank/sections/AuditTab";
import { ComplianceTab } from "@/components/credit-hub/bank/sections/ComplianceTab";
import { DocumentsTab } from "@/components/credit-hub/bank/sections/DocumentsTab";
import { StipulationsTab } from "@/components/credit-hub/bank/sections/StipulationsTab";
import { chMoney, chMoneyExact } from "@/lib/credit-hub/ch-base";
import { claimBankApplication } from "@/lib/bank-application-detail/claim-application";
import { useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import type { DecisionMode, DecisionState } from "@/lib/credit-hub/ch-types";
import type { BankDetailLayoutProps, BankDocumentPayload, BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import { mapBackendRiskLevel } from "@/lib/credit-hub/types/bank-views";
import type { BankDecisionRequest, BankDecisionTerms, BankDecisionType } from "@/lib/credit-hub/types/bankDecision";
import { useAuth } from "@/hooks/useAuth";

function defaultTerms(payload: BankReviewPayload): BankDecisionTerms {
  const analysis = payload.analysis;
  const metrics = analysis?.metrics;
  const financial = payload.financial ?? {};
  return {
    approved_amount: Number(financial.requested_amount ?? analysis?.financed_amount ?? 0),
    interest_rate: Number(metrics?.annual_rate ?? financial.requested_rate ?? 18),
    term_months: Number(metrics?.term_months ?? financial.term_months ?? 36),
    down_payment_required: Number(metrics?.down_payment ?? financial.down_payment ?? 0),
    conditions: ["Validación documental final"],
  };
}

function modeToDecision(mode: DecisionMode): BankDecisionType {
  if (mode === "reject") return "RECHAZADO";
  if (mode === "counter") return "CONTRA_OFERTA";
  return "APROBADO";
}

export function BankDetailLayout({ application, compliance, audit, counterOffer }: BankDetailLayoutProps) {
  const { user } = useAuth();
  const payload = application.application_payload as BankReviewPayload;
  const applicant = payload.applicant ?? {};
  const financial = payload.financial ?? {};
  const vehicle = payload.vehicle ?? {};
  const analysis = payload.analysis;
  const docs = useMemo(() => {
    const raw = payload.documents;
    return Array.isArray(raw) ? (raw as BankDocumentPayload[]) : [];
  }, [payload.documents]);

  const decisionMutation = useBankDecision(application.application_id);
  const [tab, setTab] = useState<"analisis" | "documentos" | "stipulaciones" | "audit" | "compliance">("analisis");
  const [panelState, setPanelState] = useState<DecisionState>("idle");
  const termsRef = useRef<BankDecisionTerms>(defaultTerms(payload));

  const autoClaimAttempted = useRef(false);
  useEffect(() => {
    if (autoClaimAttempted.current || application.application_payload?.bank_decision) return;
    const analystId = user?.id;
    if (!analystId) return;
    autoClaimAttempted.current = true;
    void claimBankApplication(application.application_id, analystId).catch(() => {});
  }, [application.application_id, application.application_payload?.bank_decision, user?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keys = ["1", "2", "3", "4", "5"];
      const i = keys.indexOf(e.key);
      if (i >= 0) setTab((["analisis", "documentos", "stipulaciones", "audit", "compliance"] as const)[i]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const issuesOpen = compliance?.issues?.length ?? 0;
  const tabs = [
    ["analisis", "Análisis"],
    ["documentos", `Documentos · ${docs.length}`],
    ["stipulaciones", "Estipulaciones"],
    ["audit", "Audit"],
    ["compliance", "Compliance"],
  ] as const;

  const handleSubmit = useCallback(
    async (mode: DecisionMode, justif: string) => {
      const body: BankDecisionRequest = {
        decision: modeToDecision(mode),
        justification: justif.trim(),
        analyst_id: user?.id || "unknown",
        terms: counterOffer?.counter_offer_terms ?? termsRef.current,
      };
      try {
        await decisionMutation.mutateAsync(body);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
          setPanelState("error");
        }
        throw err;
      }
    },
    [counterOffer?.counter_offer_terms, decisionMutation, user?.id]
  );

  const applicantName = String(applicant.name ?? applicant.full_name ?? "Cliente");
  const rate = Number(financial.requested_rate ?? analysis?.metrics?.annual_rate ?? 17.5);
  const term = Number(financial.term_months ?? analysis?.metrics?.term_months ?? 48);
  const amount = Number(financial.requested_amount ?? analysis?.financed_amount ?? 0);

  if (!application) return <DetailSkeleton />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div>
          <Link href="/credit-hub/bank/applications" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ marginLeft: -9, marginBottom: 6 }}>
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Volver a la bandeja
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 className="ch-serif" style={{ margin: 0, fontSize: 28, letterSpacing: "-0.02em" }}>
              {applicantName}
            </h1>
            <span className="ch-pill" style={{ color: "var(--ch-info-text)", background: "var(--ch-info-soft)", height: 24 }}>
              En revisión
            </span>
          </div>
          <div className="ch-mono" style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 6 }}>
            {application.application_id}
            {applicant.rfc ? ` · RFC ${applicant.rfc}` : ""}
            {applicant.city ? ` · ${applicant.city}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Imprimir
          </button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm">
            <Download className="h-3.5 w-3.5" aria-hidden />
            Exportar PDF
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 8fr) 4fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="ch-card" style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px" }}>
              {[
                ["Concesionario", String(vehicle.dealer ?? "—")],
                ["Vehículo", String(vehicle.label ?? (`${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "—"))],
                ["Monto solicitado", chMoneyExact(amount)],
                ["Plazo", `${term} meses`],
                ["Tasa solicitada", `${rate}%`],
                ["Enganche", `${chMoney(Number(financial.down_payment ?? 0))}${financial.ltv != null ? ` · ${(Number(financial.ltv) * 100).toFixed(0)}% LTV` : ""}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="ch-eyebrow">{k}</div>
                  <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            {analysis ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, borderLeft: "1px solid var(--ch-line)", paddingLeft: 20 }}>
                <ScoreVisual score={analysis.score} size={132} />
                <RiskBand level={mapBackendRiskLevel(analysis.risk_level)} />
              </div>
            ) : null}
          </div>

          <div>
            <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--ch-line)", marginBottom: 16 }} role="tablist">
              {tabs.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: "11px 14px",
                    border: "none",
                    background: "transparent",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: tab === k ? 600 : 500,
                    color: tab === k ? "var(--ch-text)" : "var(--ch-text-3)",
                    borderBottom: "2px solid",
                    borderBottomColor: tab === k ? "var(--ch-accent-mid)" : "transparent",
                    cursor: "pointer",
                    marginBottom: -1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  {l}
                  {k === "compliance" && issuesOpen > 0 ? (
                    <span style={{ minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--ch-danger)", color: "#fff", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      {issuesOpen}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            {tab === "analisis" ? <AnalysisTab payload={payload} /> : null}
            {tab === "documentos" ? <DocumentsTab docs={docs} /> : null}
            {tab === "stipulaciones" ? <StipulationsTab applicationId={application.application_id} /> : null}
            {tab === "audit" ? <AuditTab audit={audit} /> : null}
            {tab === "compliance" ? <ComplianceTab report={compliance} applicationId={application.application_id} /> : null}
          </div>
        </div>

        <DecisionPanel amount={amount} term={term} rate={rate} sticky state={panelState} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
