"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { DecisionPanel, DetailSkeleton, RiskBand, ScoreVisual } from "@/components/credit-hub/primitives";
import { EscalateKycButton } from "@/components/credit-hub/bank/EscalateKycButton";
import { PilotLabelsRow } from "@/components/credit-hub/labels/PilotLabelsRow";
import type { PilotLabels } from "@/lib/credit-hub/labels/pilot-labels";
import type { DeclaracionVehiculoPayload } from "@/lib/credit-hub/dealer/vehicle-declaration";
import { AnalysisTab } from "@/components/credit-hub/bank/sections/AnalysisTab";
import { AuditTab } from "@/components/credit-hub/bank/sections/AuditTab";
import { ComplianceTab } from "@/components/credit-hub/bank/sections/ComplianceTab";
import { DocumentsTab } from "@/components/credit-hub/bank/sections/DocumentsTab";
import { StipulationsTab } from "@/components/credit-hub/bank/sections/StipulationsTab";
import { ConditionsPanel } from "@/components/credit-hub/bank/sections/ConditionsPanel";
import { CounterOfferPanel } from "@/components/credit-hub/bank/sections/CounterOfferPanel";
import { OfferComparePanel } from "@/components/credit-hub/bank/sections/OfferComparePanel";
import { AmortizationTable } from "@/components/credit-hub/dealer/AmortizationTable";
import { VerificationsTab } from "@/components/credit-hub/bank/sections/VerificationsTab";
import { ApplicationMessageThread, useMessageUnreadCount } from "@/components/credit-hub/dealer/ApplicationMessageThread";
import { DisbursementPanel } from "@/components/credit-hub/bank/sections/DisbursementPanel";
import { InternalNotesTab, useNotesEndpointAvailable } from "@/components/credit-hub/bank/sections/InternalNotesTab";
import { AssignedAnalystSection } from "@/components/credit-hub/bank/AssignedAnalystSection";
import { FieldWithModifiedBadge } from "@/components/credit-hub/bank/ModifiedFieldBadge";
import { isBankNotesRole } from "@/lib/credit-hub/bank/bankExperienceHelpers";
import { getEditHistory, modifiedFieldKeysFromHistory } from "@/lib/credit-hub/api/operationalClient";
import { extractDisplayStatus } from "@/lib/credit-hub/honesty/display-status";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { chMoney, chMoneyExact } from "@/lib/credit-hub/ch-base";
import { claimBankApplication } from "@/lib/bank-application-detail/claim-application";
import { useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import type { DecisionMode, DecisionState } from "@/lib/credit-hub/ch-types";
import type { BankDetailLayoutProps, BankDocumentPayload, BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import { mapBackendRiskLevel } from "@/lib/credit-hub/types/bank-views";
import type { BankDecisionRequest, BankDecisionTerms, BankDecisionType } from "@/lib/credit-hub/types/bankDecision";
import { useAuth } from "@/hooks/useAuth";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";

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
  const { apiTenantId } = useTenant();
  const { can: actorCan, roleKey } = useCreditHubActor();
  const notesProbe = useNotesEndpointAvailable(application.application_id);
  const showNotesTab = isBankNotesRole(roleKey) && notesProbe.available;
  const canDecide = actorCan("create_decision");
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
  const [tab, setTab] = useState<
    "analisis" | "documentos" | "stipulaciones" | "audit" | "compliance" | "verificaciones" | "mensajes" | "notas"
  >("analisis");
  const [panelState, setPanelState] = useState<DecisionState>("idle");
  const [decisionErrorDetail, setDecisionErrorDetail] = useState<string | null>(null);
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
      const keys = ["1", "2", "3", "4", "5", "6"];
      const i = keys.indexOf(e.key);
      if (i >= 0) setTab((["analisis", "documentos", "stipulaciones", "audit", "compliance", "verificaciones"] as const)[i]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const issuesOpen = compliance?.issues?.length ?? 0;
  const messageUnread = useMessageUnreadCount(application.application_id, "bank_analyst");
  const tabs = [
    ["analisis", "Análisis"],
    ["documentos", `Documentos · ${docs.length}`],
    ["stipulaciones", "Estipulaciones"],
    ["audit", "Audit"],
    ["compliance", "Compliance"],
    ["verificaciones", "Verificaciones"],
    ["mensajes", messageUnread != null && messageUnread > 0 ? `Mensajes (${messageUnread})` : "Mensajes"],
    ...(showNotesTab ? ([["notas", "Notas internas"]] as const) : []),
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
        setDecisionErrorDetail(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg.includes("OFFER_ROOM_CLOSED") || msg.toLowerCase().includes("offer_room_closed")) {
          setDecisionErrorDetail(
            "La sala de ofertas está cerrada para esta solicitud. No se pueden registrar más decisiones.",
          );
        } else if (msg.includes("409") || msg.toLowerCase().includes("conflict")) {
          setDecisionErrorDetail(null);
        }
        setPanelState("error");
        throw err;
      }
    },
    [counterOffer?.counter_offer_terms, decisionMutation, user?.id]
  );

  const applicantName = String(applicant.name ?? applicant.full_name ?? "Cliente");
  const pilotLabels = (payload.pilot_labels ?? {}) as PilotLabels;
  const declaracion = (payload.declaracion_vehiculo ?? null) as DeclaracionVehiculoPayload | null;
  const vehicleVin = String((vehicle as { vin?: string }).vin ?? "");
  const rate = Number(financial.requested_rate ?? analysis?.metrics?.annual_rate ?? 17.5);
  const term = Number(financial.term_months ?? analysis?.metrics?.term_months ?? 48);
  const amount = Number(financial.requested_amount ?? analysis?.financed_amount ?? 0);

  const displayStatus = extractDisplayStatus(payload.expediente_meta) ?? application.state ?? null;

  const editHistoryQ = useQuery({
    queryKey: ["edit-history", apiTenantId, application.application_id],
    queryFn: () => getEditHistory({ tenantId: apiTenantId!, applicationId: application.application_id, actorRole: "bank_analyst" }),
    enabled: !!apiTenantId,
    retry: false,
  });
  const modifiedFields = useMemo(
    () => modifiedFieldKeysFromHistory(editHistoryQ.data?.entries),
    [editHistoryQ.data?.entries],
  );

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
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" data-testid="print-btn-stub">
            Imprimir
          </button>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" data-testid="export-pdf-btn-stub">
            Exportar PDF
          </button>
        </div>
      </div>

      <PilotLabelsRow labels={pilotLabels} prominent />

      <AssignedAnalystSection applicationId={application.application_id} roleKey={roleKey} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <EscalateKycButton applicationId={application.application_id} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 8fr) 4fr", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="ch-card" style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 18px" }}>
              <div>
                <div className="ch-eyebrow">Concesionario</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {String(vehicle.dealer ?? "—")}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Vehículo</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {String(vehicle.label ?? (`${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "—"))}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Monto solicitado</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {chMoneyExact(amount)}
                </div>
              </div>
              <FieldWithModifiedBadge
                label="Plazo"
                value={`${term} meses`}
                modified={modifiedFields.has("desired_term_months") || modifiedFields.has("term_months")}
              />
              <div>
                <div className="ch-eyebrow">Tasa solicitada</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {rate}%
                </div>
              </div>
              <FieldWithModifiedBadge
                label="Enganche"
                value={`${chMoney(Number(financial.down_payment ?? 0))}${financial.ltv != null ? ` · ${(Number(financial.ltv) * 100).toFixed(0)}% LTV` : ""}`}
                modified={modifiedFields.has("down_payment")}
              />
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
            {tab === "analisis" ? (
              <>
                <AnalysisTab payload={payload} />
                <div style={{ marginTop: 16 }}>
                  <AmortizationTable applicationId={application.application_id} actorRole="bank_analyst" />
                </div>
              </>
            ) : null}
            {tab === "documentos" ? <DocumentsTab docs={docs} applicationId={application.application_id} /> : null}
            {tab === "stipulaciones" ? (
              <div className="space-y-4">
                <ConditionsPanel applicationId={application.application_id} />
                <StipulationsTab applicationId={application.application_id} />
              </div>
            ) : null}
            {tab === "audit" ? <AuditTab audit={audit} /> : null}
            {tab === "compliance" ? <ComplianceTab report={compliance} applicationId={application.application_id} /> : null}
            {tab === "verificaciones" ? (
              <VerificationsTab
                applicationId={application.application_id}
                declaracion={declaracion}
                vehicleVin={vehicleVin}
              />
            ) : null}
            {tab === "mensajes" ? (
              <ApplicationMessageThread applicationId={application.application_id} actorRole="bank_analyst" />
            ) : null}
            {tab === "notas" && showNotesTab ? (
              <InternalNotesTab applicationId={application.application_id} />
            ) : null}
          </div>
        </div>

        <DecisionPanel
          amount={amount}
          term={term}
          rate={rate}
          sticky
          state={panelState}
          canDecide={canDecide}
          errorDetail={decisionErrorDetail}
          onSubmit={handleSubmit}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CounterOfferPanel applicationId={application.application_id} />
          <OfferComparePanel applicationId={application.application_id} />
          <DisbursementPanel applicationId={application.application_id} displayStatus={displayStatus} />
        </div>
      </div>
    </div>
  );
}
