"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { DecisionPanel, DetailSkeleton, RiskBand, ScoreVisual } from "@/components/credit-hub/primitives";
import { PrintExportActions } from "@/components/credit-hub/bank/PrintExportActions";
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
import { extractDisplayStatus, formatApplicationStateLabel } from "@/lib/credit-hub/honesty/display-status";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { chMoney, chMoneyExact } from "@/lib/credit-hub/ch-base";
import { useBankDecision } from "@/lib/credit-hub/hooks/useBankDecision";
import type { DecisionMode, DecisionState } from "@/lib/credit-hub/ch-types";
import type { BankDetailLayoutProps, BankDocumentPayload, BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import { mapBackendRiskLevel } from "@/lib/credit-hub/types/bank-views";
import type { BankDecisionRequest, BankDecisionTerms, BankDecisionType } from "@/lib/credit-hub/types/bankDecision";
import { useAuth } from "@/hooks/useAuth";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { getOfferCompare } from "@/lib/credit-hub/api/bankExperienceClient";
import { CHApiError } from "@/lib/credit-hub/api/client";

function defaultTerms(payload: BankReviewPayload): Partial<BankDecisionTerms> {
  const analysis = payload.analysis;
  const metrics = analysis?.metrics;
  const financial = payload.financial ?? {};
  // F4: Prefer requested_amount; fallback only to financed_amount if both are meaningful
  const approvedAmount = financial.requested_amount ?? analysis?.financed_amount;
  return {
    ...(approvedAmount != null ? { approved_amount: Number(approvedAmount) } : {}),
    ...((financial.requested_rate ?? metrics?.annual_rate) != null
      ? { interest_rate: Number(financial.requested_rate ?? metrics?.annual_rate) }
      : {}),
    ...((financial.term_months ?? metrics?.term_months) != null
      ? { term_months: Number(financial.term_months ?? metrics?.term_months) }
      : {}),
    ...((financial.down_payment ?? metrics?.down_payment) != null
      ? { down_payment_required: Number(financial.down_payment ?? metrics?.down_payment) }
      : {}),
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
  const hasBankDecision = Boolean(application.application_payload?.bank_decision);
  const canDecide = actorCan("create_decision") && !hasBankDecision;
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
  const offerCompareQuery = useQuery({
    queryKey: ["offer-compare", apiTenantId, application.application_id],
    queryFn: () => getOfferCompare({ tenantId: apiTenantId!, applicationId: application.application_id }),
    enabled: !!apiTenantId,
    retry: false,
  });
  const lenderOptions = useMemo(() => {
    const compareCodes = (offerCompareQuery.data?.offers_detail ?? [])
      .map((offer) => offer.lender_code?.trim())
      .filter((code): code is string => Boolean(code));
    if (compareCodes.length > 0) return [...new Set(compareCodes)];
    const claims = payload.bank_claims_by_lender;
    return claims && typeof claims === "object" && !Array.isArray(claims) ? Object.keys(claims) : [];
  }, [offerCompareQuery.data, payload.bank_claims_by_lender]);
  const [selectedLenderCode, setSelectedLenderCode] = useState("");
  useEffect(() => {
    if (lenderOptions.length === 1) setSelectedLenderCode(lenderOptions[0]);
    if (selectedLenderCode && !lenderOptions.includes(selectedLenderCode)) setSelectedLenderCode("");
  }, [lenderOptions, selectedLenderCode]);
  const [tab, setTab] = useState<
    "analisis" | "documentos" | "stipulaciones" | "audit" | "compliance" | "verificaciones" | "mensajes" | "notas"
  >("analisis");
  const [panelState, setPanelState] = useState<DecisionState>("idle");
  const [decisionErrorDetail, setDecisionErrorDetail] = useState<string | null>(null);
  const termsRef = useRef<Partial<BankDecisionTerms>>(defaultTerms(payload));

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
      // DIAGNOSTIC: Log actual user structure to verify analyst_id path
      console.log("[decision] user object:", user);
      console.log("[decision] user?.id:", user?.id);
      
      const analystId = user?.id || "";
      
      // Validación crítica: analyst_id debe ser un UUID válido
      if (!analystId) {
        console.error("[decision] analyst_id is empty. user:", user);
        setPanelState("error");
        setDecisionErrorDetail("Error de sesión: no se pudo identificar al analista. Recarga la página.");
        return;
      }
      
      const body: BankDecisionRequest = {
        decision: modeToDecision(mode),
        justification: justif.trim(),
        analyst_id: analystId,
        lender_code: lenderOptions.length === 1 ? lenderOptions[0] : selectedLenderCode || undefined,
        terms: counterOffer?.counter_offer_terms ?? termsRef.current,
      };
      try {
        await decisionMutation.mutateAsync(body);
        setDecisionErrorDetail(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        if (msg.includes("OFFER_ROOM_CLOSED") || msg.toLowerCase().includes("offer_room_closed")) {
          setDecisionErrorDetail(
            "La sala de ofertas está cerrada para esta solicitud. No se pueden registrar más decisiones.",
          );
        } else if (err instanceof CHApiError) {
          setDecisionErrorDetail(`Error ${err.status}: ${err.detail}`);
        } else {
          setDecisionErrorDetail(msg);
        }
        setPanelState("error");
        throw err;
      }
    },
    [counterOffer?.counter_offer_terms, decisionMutation, lenderOptions, selectedLenderCode, user?.id]
  );

  const applicantName = String(applicant.name ?? applicant.full_name ?? "Cliente");
  const pilotLabels = (payload.pilot_labels ?? {}) as PilotLabels;
  const declaracion = (payload.declaracion_vehiculo ?? null) as DeclaracionVehiculoPayload | null;
  const vehicleVin = String((vehicle as { vin?: string }).vin ?? "");
  const rate = Number(financial.requested_rate ?? analysis?.metrics?.annual_rate ?? 17.5);
  const term = Number(financial.term_months ?? analysis?.metrics?.term_months ?? 48);
  // F4: Never invent 0 when amount is absent — let formatter handle null
  const amount = financial.requested_amount ?? analysis?.financed_amount ?? null;

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
            {displayStatus ? (
              <span className="ch-pill" style={{ color: "var(--ch-info-text)", background: "var(--ch-info-soft)", height: 24 }}>
                {formatApplicationStateLabel(displayStatus)}
              </span>
            ) : null}
          </div>
          <div className="ch-mono" style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 6 }}>
            {application.application_id}
            {applicant.rfc ? ` · RFC ${applicant.rfc}` : ""}
            {applicant.city ? ` · ${applicant.city}` : ""}
          </div>
        </div>
        <PrintExportActions applicationId={application.application_id} />
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
                  {String((vehicle as any).dealer ?? (vehicle as any).dealer_name ?? (vehicle as any).dealerName ?? "—")}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Vehículo</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                  {String(
                    (vehicle as any).label ?? 
                    (vehicle as any).vehicle_label ?? 
                    (`${(vehicle as any).make ?? ""} ${(vehicle as any).model ?? ""} ${(vehicle as any).year ?? ""}`.trim() || "—")
                  )}
                </div>
              </div>
              <div>
                <div className="ch-eyebrow">Monto solicitado</div>
                <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }} data-testid="detail-header-amount">
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
                value={`${chMoney(Number(financial.down_payment ?? 0))}${financial.ltv != null ? ` · ${(Number(financial.ltv) * 100).toFixed(1)}%` : ""}`}
                modified={modifiedFields.has("down_payment")}
              />
            </div>
            {analysis ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, borderLeft: "1px solid var(--ch-line)", paddingLeft: 20 }}>
                <ScoreVisual score={analysis.score} size={132} />
                {analysis.risk_level != null ? (
                  <RiskBand level={mapBackendRiskLevel(analysis.risk_level)} />
                ) : null}
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
          amount={amount ?? 0}
          term={term}
          rate={rate}
          sticky
          state={panelState}
          canDecide={canDecide}
          errorDetail={decisionErrorDetail}
          lenderOptions={lenderOptions}
          lenderCode={selectedLenderCode}
          onLenderChange={setSelectedLenderCode}
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
