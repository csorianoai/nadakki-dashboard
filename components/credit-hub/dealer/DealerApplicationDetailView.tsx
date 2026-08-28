"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, Car, CheckCircle, Clock, Mail, Phone, User } from "lucide-react";
import { DetailSkeleton, EmptyStateRich, RiskBand, ScoreVisual } from "@/components/credit-hub/primitives";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { DealerStatusBadge } from "@/components/credit-hub/dealer/shared/dealerUi";
import { DealerApplicationDocumentsSection } from "@/components/credit-hub/dealer/DealerApplicationDocumentsSection";
import { ApplicationEditPanel } from "@/components/credit-hub/dealer/ApplicationEditPanel";
import { EditHistorySection } from "@/components/credit-hub/dealer/EditHistorySection";
import { DocumentRequestsDealerSection } from "@/components/credit-hub/dealer/DocumentRequestsDealerSection";
import { ApplicationMessageThread } from "@/components/credit-hub/dealer/ApplicationMessageThread";
import { PilotLabelsRow } from "@/components/credit-hub/labels/PilotLabelsRow";
import { extractPilotLabels } from "@/lib/credit-hub/labels/pilot-labels";
import { OfferConfirmModal } from "@/components/credit-hub/dealer/OfferConfirmModal";
import { OfferRejectModal } from "@/components/credit-hub/dealer/OfferRejectModal";
import { CreditCoreApiError, acceptOffer } from "@/lib/credit-hub/api/creditCoreClient";
import { CHApiError } from "@/lib/credit-hub/api/client";
import { isBankExperienceEndpointUnavailable, postRejectOffer } from "@/lib/credit-hub/api/bankExperienceClient";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useApplicationOffers } from "@/lib/credit-hub/hooks/useApplicationOffers";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useCreditHubActor } from "@/lib/credit-hub/hooks/useCreditHubActor";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { chMoneyExact, chScoreBand } from "@/lib/credit-hub/ch-base";
import { chRelTimeDealer, parseRequestedAmount } from "@/lib/credit-hub/dealer/dealerFormat";
import { offerHasCompleteTerms } from "@/lib/credit-hub/offers/offer-terms";
import type { DealerApplicationDetailViewProps } from "@/lib/credit-hub/types/dealer-views";
import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";
import { CancelApplicationButton, OperationalStatusBanner } from "@/components/credit-hub/dealer/OperationalActions";
import { AmortizationTable } from "@/components/credit-hub/dealer/AmortizationTable";
import { extractOfferValidUntil, OfferValidityBadge } from "@/components/credit-hub/dealer/OfferValidityBadge";
import { extractDisplayStatus } from "@/lib/credit-hub/honesty/display-status";
import { isCounterOffer, isDealerRejectedOffer } from "@/lib/credit-hub/dealer/offer-actions";
import { SimulatedOfferNotice } from "@/components/credit-hub/elite/OfferComparisonCard";
import type { RiskLevel } from "@/lib/credit-hub/ch-types";
const SELECTABLE_OFFER_STATUSES = new Set(["pending", "approved", "counter_offer"]);

/**
 * Title-case a raw lender_code for display. No authoritative lender_code → name
 * dictionary exists in the codebase, so we surface a readable form of the code
 * itself rather than inventing bank names.
 */
function lenderLabel(code: string): string {
  if (!code.trim()) return "—";
  return code
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function stageLabel(status: CreditApplicationStatus): string {
  switch (status) {
    case "submitted":
      return "En cola de admisión";
    case "processing":
    case "processed":
      return "En revisión de riesgo";
    case "manual_review":
      return "En revisión manual";
    case "approved":
    case "approved_with_stipulations":
      return "Aprobada";
    case "rejected":
    case "declined":
      return "Rechazada";
    case "offered":
    case "counter_offer":
      return "Contraoferta disponible";
    default:
      return "En trámite";
  }
}

function stageMessage(status: CreditApplicationStatus, displayStatus: string | null): string {
  const serverStatus = (displayStatus ?? "").toUpperCase();
  if (serverStatus === "DRAFT" || status === "draft") return "Borrador guardado. Aún no se ha enviado a la institución.";
  if (serverStatus === "SENT_TO_BANKS" || serverStatus === "BANK_SUBMITTED") return "Solicitud enviada a la institución. Te avisaremos cuando haya respuesta.";
  if (serverStatus === "RECEIVED" || serverStatus === "AI_ANALYSIS" || serverStatus === "AI_COMPLETE" || status === "submitted" || status === "processing") {
    return "Solicitud recibida. El análisis está en curso.";
  }
  return "El estado se actualizará con la información registrada en el servidor.";
}

export function DealerApplicationDetailView({ applicationId }: DealerApplicationDetailViewProps) {
  const router = useRouter();
  const t = useTranslations();
  const { apiTenantId } = useTenant();
  const { can: actorCan } = useCreditHubActor();
  const canAcceptOffer = actorCan("accept_offer");
  const { tenantConfig } = useTenantConfig();
  const { application: data, events, isLoading, error, refetch } = useCreditApplicationDetail(applicationId);
  const {
    offers,
    isLoading: offersLoading,
    isError: offersError,
    error: offersErrorObj,
    refetch: refetchOffers,
  } = useApplicationOffers(applicationId);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [acceptState, setAcceptState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null);
  const [confirmOffer, setConfirmOffer] = useState<CreditOffer | null>(null);
  const [rejectOffer, setRejectOffer] = useState<CreditOffer | null>(null);
  const [rejectState, setRejectState] = useState<"idle" | "loading">("idle");
  const [rejectEndpointUnavailable, setRejectEndpointUnavailable] = useState(false);
  const [locallyRejectedIds, setLocallyRejectedIds] = useState<Set<string>>(new Set());

  const currencyPrefix =
    tenantConfig.currency_code === "DOP" ? "RD$" : tenantConfig.currency_code === "MXN" ? "MX$" : `${tenantConfig.currency_code} `;

  const handleAcceptOffer = useCallback(
    async (offerId: string) => {
      if (!apiTenantId || acceptState === "loading") return;
      setAcceptingOfferId(offerId);
      setAcceptState("loading");
      setAcceptError(null);
      setAcceptMessage(null);
      try {
        const result = await acceptOffer({ tenantId: apiTenantId, applicationId, offerId });
        setAcceptState("success");
        setConfirmOffer(null);
        const siblings = result.siblings_not_selected;
        setAcceptMessage(
          typeof siblings === "number" && siblings > 0
            ? `Oferta aceptada. Otras ${siblings} oferta${siblings === 1 ? "" : "s"} quedaron descartadas.`
            : "Oferta aceptada."
        );
        // Refetch the offers list (small, ≤4) for canonical accepted/not_selected
        // statuses, plus the dossier for status badge / stage consistency.
        await Promise.all([refetchOffers(), refetch()]);
      } catch (err) {
        setAcceptState("error");
        setAcceptError(
          err instanceof CreditCoreApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Error al aceptar la oferta"
        );
      }
    },
    [applicationId, apiTenantId, acceptState, refetchOffers, refetch]
  );

  const handleRejectOffer = useCallback(
    async (offerId: string) => {
      if (!apiTenantId || rejectState === "loading") return;
      setRejectState("loading");
      try {
        await postRejectOffer({ tenantId: apiTenantId, applicationId, offerId, actorRole: "dealer" });
        setRejectOffer(null);
        setLocallyRejectedIds((prev) => new Set(prev).add(offerId));
        forgeToast.success("Contrapropuesta rechazada");
        await refetchOffers();
      } catch (err) {
        if (err instanceof CHApiError && isBankExperienceEndpointUnavailable(err)) {
          setRejectEndpointUnavailable(true);
          forgeToast.error("Rechazo de contrapropuesta no disponible aún");
        } else {
          forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo rechazar la contrapropuesta");
        }
      } finally {
        setRejectState("idle");
      }
    },
    [apiTenantId, applicationId, rejectState, refetchOffers],
  );

  if (isLoading) return <DetailSkeleton />;

  if (error || !data) {
    const notFound = error instanceof CreditCoreApiError && error.status === 404;
    return (
      <EmptyStateRich
        variant={notFound ? "empty" : "error"}
        title={notFound ? t.dealer.detail_not_found : t.dealer.detail_load_error}
        description={notFound ? t.dealer.detail_not_found_hint : error instanceof Error ? error.message : t.dealer.detail_retry_hint}
        primary={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" className="ch-btn ch-btn-secondary" onClick={() => router.back()}>
              {t.common.go_back}
            </button>
            {!notFound ? (
              <button type="button" className="ch-btn ch-btn-persona" onClick={() => void refetch()}>
                {t.common.retry}
              </button>
            ) : null}
          </div>
        }
      />
    );
  }

  const amount = parseRequestedAmount(data.requested_amount);
  const approved = data.status === "approved" || data.status === "approved_with_stipulations" || data.decision === "approved";
  const rejected = data.status === "rejected" || data.status === "declined" || data.decision === "rejected" || data.decision === "declined";
  const score = data.score != null ? Number(data.score) : null;
  const acceptedOffer = offers.find((o) => o.status === "accepted") ?? null;
  const hasAcceptedOffer = acceptedOffer != null;
  const pilotLabels = extractPilotLabels(data.raw);
  const displayStatus = data.display_status ?? extractDisplayStatus(data.raw);
  const rawMeta = (data.raw && typeof data.raw === "object" ? data.raw : {}) as Record<string, unknown>;
  const disbursementReference =
    typeof rawMeta.disbursement_reference === "string" ? rawMeta.disbursement_reference : null;
  const cancelReason = typeof rawMeta.cancel_reason === "string" ? rawMeta.cancel_reason : null;

  // D1: find "MEJOR" offer — lowest APR among selectable (approved/pending/counter_offer) offers
  const bestOfferId: string | null = (() => {
    if (hasAcceptedOffer) return null; // already chosen, no badge needed
    const candidates = offers.filter(
      (o) => o.interest_rate_apr != null && SELECTABLE_OFFER_STATUSES.has(o.status),
    );
    if (candidates.length < 2) return null; // badge only meaningful with ≥2 options
    candidates.sort((a, b) => (a.interest_rate_apr ?? Infinity) - (b.interest_rate_apr ?? Infinity));
    return candidates[0].id;
  })();

  return (
    <div>
      <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ marginLeft: -9, marginBottom: 8, minHeight: 44 }} onClick={() => router.push("/credit-hub/dealer/applications")}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Mis solicitudes
      </button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="ch-serif" style={{ margin: 0, fontSize: 24, letterSpacing: "-0.01em" }}>
            {data.applicant_name}
          </h1>
          <div className="ch-mono" style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 5 }}>
            {data.application_id} · {[data.vehicle_make, data.vehicle_model].filter(Boolean).join(" ") || "—"}
          </div>
        </div>
        <DealerStatusBadge status={data.status} size="lg" />
      </div>

      <PilotLabelsRow labels={pilotLabels} prominent />

      <OperationalStatusBanner
        displayStatus={displayStatus}
        cancelReason={cancelReason}
        disbursementReference={disbursementReference}
      />

      {score != null && Number.isFinite(score) ? (
        <div className="ch-card mb-4 flex flex-col items-center gap-4 p-[18px] sm:flex-row sm:items-center sm:gap-5">
          <ScoreVisual score={score} size={120} />
          <div>
            <div className="ch-eyebrow">Resultado del análisis</div>
            <div style={{ fontSize: 15, fontWeight: 600, margin: "6px 0 8px" }}>Score {score}</div>
            <RiskBand level={(chScoreBand(score).key === "verylow" ? "low" : chScoreBand(score).key) as RiskLevel} />
          </div>
        </div>
      ) : null}

      <div className="ch-card mb-4 p-[18px]">
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
          Estado de tu solicitud
        </h2>
        {approved ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--ch-success-text)", background: "var(--ch-success-soft)", padding: 12, borderRadius: 8 }}>
            ¡Felicitaciones! Esta solicitud fue aprobada. Contacto: {tenantConfig.institution_name}
          </p>
        ) : null}
        {rejected ? (
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--ch-danger-text)", background: "var(--ch-danger-soft)", padding: 12, borderRadius: 8 }}>
            Esta solicitud no fue aprobada. Puedes enviar una nueva solicitud con datos actualizados.
          </p>
        ) : null}
        {!approved && !rejected ? (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--ch-text-2)", lineHeight: 1.5 }}>
            Etapa actual: <strong>{stageLabel(data.status)}</strong>. {stageMessage(data.status, displayStatus)}
            {/* TODO(tenant-config): Read from tenantConfig.sla_commitment_hours when available */}
          </div>
        ) : null}
      </div>

      {offersLoading ? (
        <div className="ch-card mb-4 p-[18px]" data-testid="offers-loading">
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
            Ofertas de bancos
          </h2>
          <p style={{ marginTop: 10, fontSize: 13, color: "var(--ch-text-3)" }}>Cargando ofertas…</p>
        </div>
      ) : offersError ? (
        <div className="ch-card mb-4 p-[18px]" data-testid="offers-error">
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
            Ofertas de bancos
          </h2>
          <p style={{ marginTop: 10, fontSize: 13, color: "var(--ch-danger-text)" }}>
            {offersErrorObj instanceof Error ? offersErrorObj.message : "No se pudieron cargar las ofertas."}
          </p>
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" style={{ marginTop: 10 }} onClick={() => void refetchOffers()}>
            {t.common.retry}
          </button>
        </div>
      ) : offers.length > 0 ? (
        <div className="ch-card mb-4 p-[18px]" data-testid="offers-section">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <h2 className="ch-serif" style={{ margin: 0, fontSize: 17 }}>
              {hasAcceptedOffer ? "Oferta seleccionada" : "Exchange multi-banco"}
            </h2>
            <DataTruthBadge level={offers.some((offer) => offer.simulated === true) ? "DEMO" : "REAL"} />
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginBottom: 14 }}>
            {hasAcceptedOffer
              ? "Ya elegiste una oferta. Las demás quedaron descartadas."
              : `${offers.length} ${offers.length === 1 ? "banco respondió" : "bancos respondieron"}. Compara y selecciona una.`}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {offers.map((offer) => {
              const isAccepted = offer.status === "accepted";
              const dealerRejected = isDealerRejectedOffer(offer, locallyRejectedIds);
              const isNotSelected =
                dealerRejected ||
                offer.status === "not_selected" ||
                offer.status === "declined" ||
                (hasAcceptedOffer && !isAccepted);
              const isCounter = isCounterOffer(offer);
              const canSelect =
                canAcceptOffer &&
                !hasAcceptedOffer &&
                !dealerRejected &&
                SELECTABLE_OFFER_STATUSES.has(offer.status) &&
                offerHasCompleteTerms(offer);
              const canReject =
                isCounter &&
                !dealerRejected &&
                !hasAcceptedOffer;
              const isThisAccepting = acceptingOfferId === offer.id && acceptState === "loading";
              const isThisRejecting = rejectOffer?.id === offer.id && rejectState === "loading";
              return (
                <div
                  key={offer.id}
                  data-testid={`offer-card-${offer.id}`}
                  data-offer-status={offer.status}
                  className="ch-card"
                  style={{
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    background: isAccepted ? "var(--ch-success-soft)" : "var(--ch-surface)",
                    borderColor: isAccepted ? "#BBF7D0" : undefined,
                    opacity: isNotSelected ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
                      {offer.lender_display_name || lenderLabel(offer.lender_code)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <OfferValidityBadge validUntil={extractOfferValidUntil(offer)} />
                      {offer.id === bestOfferId ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "var(--ch-persona)",
                            color: "#fff",
                          }}
                        >
                          MEJOR
                        </span>
                      ) : null}
                      {isAccepted ? (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--ch-success-text)" }}>
                          <CheckCircle className="h-4 w-4" aria-hidden />
                          Elegida
                        </span>
                      ) : dealerRejected ? (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--ch-text-3)" }}
                          data-testid={`offer-rejected-badge-${offer.id}`}
                        >
                          Rechazada
                        </span>
                      ) : isNotSelected ? (
                        <span className="text-xs" style={{ color: "var(--ch-text-3)" }}>No seleccionada</span>
                      ) : null}
                    </div>
                  </div>
                  <SimulatedOfferNotice offer={offer} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="ch-eyebrow">Monto aprobado</div>
                      <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {offer.amount_approved != null ? chMoneyExact(offer.amount_approved, currencyPrefix) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="ch-eyebrow">Tasa (APR)</div>
                      <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {offer.interest_rate_apr != null
                          ? `${(offer.interest_rate_apr < 1 ? offer.interest_rate_apr * 100 : offer.interest_rate_apr).toFixed(2)}%`
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="ch-eyebrow">Plazo</div>
                      <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {offer.term_months != null ? `${offer.term_months} meses` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="ch-eyebrow">Cuota mensual</div>
                      <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {offer.monthly_payment != null ? chMoneyExact(offer.monthly_payment, currencyPrefix) : "—"}
                      </div>
                    </div>
                    {offer.total_cost != null ? (
                      <div className="col-span-2">
                        <div className="ch-eyebrow">Costo total del crédito</div>
                        <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                          {chMoneyExact(offer.total_cost, currencyPrefix)}
                          {offer.currency ? ` ${offer.currency}` : ""}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {(offer.stipulations?.length ?? 0) > 0 ? (
                    <div style={{ fontSize: 12, color: "var(--ch-text-2)", marginTop: 2 }}>
                      <div className="ch-eyebrow" style={{ marginBottom: 4 }}>Condiciones</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {(offer.stipulations ?? []).map((s) => (
                          <li key={s}>{s.replace(/_/g, " ")}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {!canSelect &&
                  !hasAcceptedOffer &&
                  SELECTABLE_OFFER_STATUSES.has(offer.status) &&
                  !offerHasCompleteTerms(offer) ? (
                    <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: 0 }}>
                      Faltan términos financieros completos para aceptar esta oferta.
                    </p>
                  ) : null}
                  {(canSelect || canReject) ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {canSelect ? (
                        <button
                          type="button"
                          className="ch-btn ch-btn-persona min-h-[44px] flex-1"
                          data-testid={`offer-accept-${offer.id}`}
                          disabled={acceptState === "loading"}
                          onClick={() => setConfirmOffer(offer)}
                        >
                          {isThisAccepting ? "Procesando…" : "Seleccionar esta oferta"}
                        </button>
                      ) : null}
                      {canReject ? (
                        <button
                          type="button"
                          className="ch-btn ch-btn-secondary min-h-[44px] flex-1"
                          data-testid={`offer-reject-${offer.id}`}
                          disabled={rejectState === "loading" || rejectEndpointUnavailable}
                          title={rejectEndpointUnavailable ? "Rechazo no disponible en este entorno" : undefined}
                          onClick={() => setRejectOffer(offer)}
                        >
                          {isThisRejecting ? "Rechazando…" : "Rechazar contrapropuesta"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {acceptMessage && acceptState === "success" ? (
            <p className="flex items-center gap-2 text-sm" style={{ color: "var(--ch-success-text)", marginTop: 14 }} data-testid="offers-accept-success">
              <CheckCircle className="h-5 w-5" aria-hidden />
              {acceptMessage}
            </p>
          ) : null}
          {acceptError && acceptState === "error" ? (
            <p style={{ marginTop: 14, fontSize: 13, color: "var(--ch-danger-text)" }} data-testid="offers-accept-error">
              {acceptError}
            </p>
          ) : null}
        </div>
      ) : null}

      <DealerApplicationDocumentsSection tenantConfig={tenantConfig} applicationRaw={data.raw} />

      {apiTenantId ? <ApplicationEditPanel application={data} tenantId={apiTenantId} onSaved={() => void refetch()} /> : null}
      <EditHistorySection applicationId={applicationId} />
      <DocumentRequestsDealerSection applicationId={applicationId} />

      <div className="ch-card mt-4 p-4" data-testid="dealer-messages-section">
        <h3 className="mb-3 text-sm font-semibold">Mensajes</h3>
        {apiTenantId ? (
          <ApplicationMessageThread
            applicationId={applicationId}
            actorRole="dealer"
            applicationContext={{
              applicantName: data.applicant_name,
              vehicleLabel: [data.vehicle_year, data.vehicle_make, data.vehicle_model].filter(Boolean).join(" "),
              requestedAmount: amount,
              currency: currencyPrefix,
            }}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="ch-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" aria-hidden />
            Cliente
          </h3>
          <dl style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <dt className="ch-eyebrow">{t.dealer.field_name}</dt>
              <dd>{data.applicant_name}</dd>
            </div>
            {data.applicant_email ? (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--ch-text-3)" }} aria-hidden />
                <div>
                  <dt className="ch-eyebrow">{t.dealer.field_email}</dt>
                  <dd>{data.applicant_email}</dd>
                </div>
              </div>
            ) : null}
            {data.applicant_phone ? (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--ch-text-3)" }} aria-hidden />
                <div>
                  <dt className="ch-eyebrow">{t.dealer.field_phone}</dt>
                  <dd>{data.applicant_phone}</dd>
                </div>
              </div>
            ) : null}
            <div>
              <dt className="ch-eyebrow">{t.dealer.field_amount}</dt>
              <dd className="ch-mono font-semibold">{chMoneyExact(amount, currencyPrefix)}</dd>
            </div>
          </dl>
        </div>

        <div className="ch-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Car className="h-4 w-4" aria-hidden />
            {t.dealer.vehicle_heading}
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {data.vehicle_year ? (
              <div>
                <dt className="ch-eyebrow">Año</dt>
                <dd>{data.vehicle_year}</dd>
              </div>
            ) : null}
            {data.vehicle_make ? (
              <div>
                <dt className="ch-eyebrow">Marca</dt>
                <dd>{data.vehicle_make}</dd>
              </div>
            ) : null}
            {data.vehicle_model ? (
              <div className="col-span-2">
                <dt className="ch-eyebrow">Modelo</dt>
                <dd>{data.vehicle_model}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="ch-card mt-4 p-4">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" aria-hidden />
          {t.dealer.timeline_heading}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {events.map((event) => (
            <div key={event.id} style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ch-persona)", marginTop: 6, flexShrink: 0 }} aria-hidden />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{event.title}</div>
                {event.description ? <div style={{ fontSize: 12, color: "var(--ch-text-3)" }}>{event.description}</div> : null}
                <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-4)", marginTop: 2 }}>
                  {chRelTimeDealer(event.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ch-success)", marginTop: 6, flexShrink: 0 }} aria-hidden />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{t.dealer.application_created}</div>
              <div className="ch-mono" style={{ fontSize: 11, color: "var(--ch-text-4)", marginTop: 2 }}>
                {chRelTimeDealer(data.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <OfferConfirmModal
        offer={confirmOffer}
        lenderName={confirmOffer ? lenderLabel(confirmOffer.lender_code) : "—"}
        currencyPrefix={currencyPrefix}
        open={confirmOffer !== null}
        onClose={() => {
          if (acceptState !== "loading") setConfirmOffer(null);
        }}
        onConfirm={(offerId) => void handleAcceptOffer(offerId)}
        isSubmitting={acceptState === "loading"}
      />

      <OfferRejectModal
        offer={rejectOffer}
        lenderName={rejectOffer ? lenderLabel(rejectOffer.lender_code) : "—"}
        open={rejectOffer !== null}
        onClose={() => {
          if (rejectState !== "loading") setRejectOffer(null);
        }}
        onConfirm={(offerId) => void handleRejectOffer(offerId)}
        isSubmitting={rejectState === "loading"}
      />

      <div className="mb-4">
        <AmortizationTable applicationId={applicationId} actorRole="dealer" />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {apiTenantId ? (
          <CancelApplicationButton
            applicationId={applicationId}
            tenantId={apiTenantId}
            displayStatus={displayStatus}
            onCancelled={() => void refetch()}
          />
        ) : null}
        <button type="button" className="ch-btn ch-btn-secondary min-h-[44px] w-full sm:w-auto" onClick={() => router.push("/credit-hub/dealer/applications")}>
          Ver todas
        </button>
        <Link href="/credit-hub/dealer/applications/new/applicant" className="ch-btn ch-btn-persona min-h-[44px] w-full sm:w-auto" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          + Nueva solicitud
        </Link>
      </div>
    </div>
  );
}
