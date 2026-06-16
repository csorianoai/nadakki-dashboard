"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, Car, CheckCircle, Clock, Mail, Phone, User } from "lucide-react";
import { DetailSkeleton, EmptyStateRich, RiskBand, ScoreVisual } from "@/components/credit-hub/primitives";
import { DealerStatusBadge } from "@/components/credit-hub/dealer/shared/dealerUi";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";
import { tokenStorage } from "@/lib/auth/token-storage";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { chMoneyExact, chScoreBand } from "@/lib/credit-hub/ch-base";
import { chRelTimeDealer, parseRequestedAmount } from "@/lib/credit-hub/dealer/dealerFormat";
import type { DealerApplicationDetailViewProps } from "@/lib/credit-hub/types/dealer-views";
import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";
import type { RiskLevel } from "@/lib/credit-hub/ch-types";

type AnyRecord = Record<string, unknown>;

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

function extractPayload(raw: unknown): { terms: AnyRecord; stipulations: AnyRecord[] } {
  const record = (raw && typeof raw === "object" ? raw : {}) as AnyRecord;
  const payload = (record.application_payload && typeof record.application_payload === "object" ? record.application_payload : {}) as AnyRecord;
  const bankDecision = (payload.bank_decision && typeof payload.bank_decision === "object" ? payload.bank_decision : {}) as AnyRecord;
  const terms = (bankDecision.terms && typeof bankDecision.terms === "object" ? bankDecision.terms : {}) as AnyRecord;
  const stipulations = Array.isArray(payload.bank_decision_stipulations) ? (payload.bank_decision_stipulations as AnyRecord[]) : [];
  return { terms, stipulations };
}

export function DealerApplicationDetailView({ applicationId }: DealerApplicationDetailViewProps) {
  const router = useRouter();
  const t = useTranslations();
  const { tenantId } = useTenant();
  const { tenantConfig } = useTenantConfig();
  const { application: data, events, isLoading, error, refetch } = useCreditApplicationDetail(applicationId);
  const [acceptState, setAcceptState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const currencyPrefix =
    tenantConfig.currency_code === "DOP" ? "RD$" : tenantConfig.currency_code === "MXN" ? "MX$" : `${tenantConfig.currency_code} `;

  const handleAcceptOffer = useCallback(async () => {
    if (!tenantId || acceptState === "loading") return;
    setAcceptState("loading");
    setAcceptError(null);
    try {
      const token = tokenStorage.getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json", "X-Tenant-ID": tenantId };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/v2/credit/applications/${applicationId}/accept-decision`, {
        method: "POST",
        headers,
        body: JSON.stringify({ notes: "Oferta aceptada por el dealer" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === "string" ? body.detail : `HTTP ${res.status}`);
      }
      setAcceptState("success");
      void refetch();
    } catch (err) {
      setAcceptState("error");
      setAcceptError(err instanceof Error ? err.message : "Error al aceptar la oferta");
    }
  }, [applicationId, tenantId, acceptState, refetch]);

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
  const { terms, stipulations } = extractPayload(data.raw);
  const hasOffer = approved && !!(terms.approved_amount || terms.interest_rate || terms.term_months);
  const score = data.score != null ? Number(data.score) : null;

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
            Etapa actual: <strong>{stageLabel(data.status)}</strong>. Tiempo estimado: 3 a 5 días hábiles.
          </div>
        ) : null}
      </div>

      {hasOffer ? (
        <div className="ch-card mb-4 p-[18px]" style={{ background: "var(--ch-success-soft)", borderColor: "#BBF7D0" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Oferta aprobada</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {terms.approved_amount ? (
              <div style={{ background: "var(--ch-surface)", borderRadius: 8, padding: "10px 12px" }}>
                <div className="ch-eyebrow">Monto</div>
                <div className="ch-mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                  {chMoneyExact(Number(terms.approved_amount), currencyPrefix)}
                </div>
              </div>
            ) : null}
            {terms.interest_rate ? (
              <div style={{ background: "var(--ch-surface)", borderRadius: 8, padding: "10px 12px" }}>
                <div className="ch-eyebrow">Tasa</div>
                <div className="ch-mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                  {String(terms.interest_rate)}%
                </div>
              </div>
            ) : null}
            {terms.term_months ? (
              <div style={{ background: "var(--ch-surface)", borderRadius: 8, padding: "10px 12px" }}>
                <div className="ch-eyebrow">Plazo</div>
                <div className="ch-mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                  {String(terms.term_months)} meses
                </div>
              </div>
            ) : null}
          </div>
          {stipulations.length > 0 ? (
            <ul style={{ marginTop: 12, fontSize: 13, color: "var(--ch-text-2)" }}>
              {stipulations.map((s, i) => (
                <li key={i}>{String(s.description || s.code || `Estipulación ${i + 1}`)}</li>
              ))}
            </ul>
          ) : null}
          <div style={{ marginTop: 14 }}>
            {acceptState === "success" ? (
              <p className="flex items-center gap-2 text-sm" style={{ color: "var(--ch-success-text)" }}>
                <CheckCircle className="h-5 w-5" aria-hidden />
                Oferta aceptada
              </p>
            ) : (
              <>
                <button type="button" className="ch-btn ch-btn-persona min-h-[44px]" disabled={acceptState === "loading"} onClick={() => void handleAcceptOffer()}>
                  {acceptState === "loading" ? "Procesando…" : "Aceptar oferta"}
                </button>
                {acceptError ? <p style={{ marginTop: 8, fontSize: 13, color: "var(--ch-danger-text)" }}>{acceptError}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}

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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
