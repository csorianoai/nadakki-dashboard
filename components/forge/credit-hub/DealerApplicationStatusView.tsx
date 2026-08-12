"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Car, CheckCircle, Clock, DollarSign, FileText, Mail, Phone, User } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Button, Card, Skeleton } from "@/components/forge";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";
import { tokenStorage } from "@/lib/auth/token-storage";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";
import { formatForgeCurrency } from "@/utils/forge-locale";

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
    case "conditioned":
      return "Condicionada — pendiente de cumplimiento";
    case "draft":
      return "Borrador";
    case "approved":
    case "approved_with_stipulations":
      return "Aprobada";
    case "rejected":
    case "declined":
      return "Rechazada";
    case "offered":
      return "Oferta disponible";
    default:
      return "En trámite";
  }
}

function rejectionCategory(decision: string | null): string {
  const d = (decision ?? "").toLowerCase();
  if (d.includes("declin") || d.includes("reject") || d.includes("rechaz")) return "Política de crédito o capacidad de pago";
  return "No aprobada en esta ocasión";
}

/** Extract nested object safely from raw API response. */
function extractPayload(raw: unknown): { bankDecision: AnyRecord; terms: AnyRecord; stipulations: AnyRecord[] } {
  const record = (raw && typeof raw === "object" ? raw : {}) as AnyRecord;
  const payload = (record.application_payload && typeof record.application_payload === "object" ? record.application_payload : {}) as AnyRecord;
  const bankDecision = (payload.bank_decision && typeof payload.bank_decision === "object" ? payload.bank_decision : {}) as AnyRecord;
  const terms = (bankDecision.terms && typeof bankDecision.terms === "object" ? bankDecision.terms : {}) as AnyRecord;
  const stipulations = Array.isArray(payload.bank_decision_stipulations) ? (payload.bank_decision_stipulations as AnyRecord[]) : [];
  return { bankDecision, terms, stipulations };
}

export function DealerApplicationStatusView({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const t = useTranslations();
  const persona = usePersona();
  const { tenantId } = useTenant();
  const { tenantConfig } = useTenantConfig();
  const { application: data, events, isLoading, error, refetch } = useCreditApplicationDetail(applicationId);

  const [acceptState, setAcceptState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[dealer-view] mount", { applicationId });
  }, [applicationId]);

  useEffect(() => {
    if (!data) return;
    console.log("[dealer-view] status", {
      applicationId,
      status: data.status,
      decision: data.decision,
    });
  }, [applicationId, data?.status, data?.decision]);

  const handleAcceptOffer = useCallback(async () => {
    if (!tenantId || acceptState === "loading") return;
    console.log("[dealer-view] accept attempt", { applicationId, tenantId });
    setAcceptState("loading");
    setAcceptError(null);
    try {
      const token = tokenStorage.getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/v2/credit/applications/${applicationId}/accept-decision`, {
        method: "POST",
        headers,
        body: JSON.stringify({ notes: "Oferta aceptada por el dealer" }),
      });
      console.log("[dealer-view] accept response", {
        applicationId,
        ok: res.ok,
        status: res.status,
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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="mb-4 h-10 w-40 rounded-forge-sm" />
        <Skeleton className="h-64 w-full rounded-forge-lg" />
      </div>
    );
  }

  if (error || !data) {
    const notFound = error instanceof CreditCoreApiError && error.status === 404;
    return (
      <div className="p-4 md:p-8">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <p className="font-medium text-forgeDanger-700">{notFound ? t.dealer.detail_not_found : t.dealer.detail_load_error}</p>
          <p className="mt-2 text-forge-sm text-forgeGray-500">
            {notFound ? t.dealer.detail_not_found_hint : error instanceof Error ? error.message : t.dealer.detail_retry_hint}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              {t.common.go_back}
            </Button>
            {!notFound ? (
              <Button type="button" variant="primary" onClick={() => void refetch()}>
                {t.common.retry}
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  const amount = Number(data.requested_amount || 0);
  const status = data.status;
  const approved = status === "approved" || status === "approved_with_stipulations" || data.decision === "approved";
  const rejected = status === "rejected" || status === "declined" || data.decision === "rejected" || data.decision === "declined";

  // Extract bank decision terms from raw API response
  const { bankDecision, terms, stipulations } = extractPayload(data.raw);
  const hasOffer = approved && !!(terms.approved_amount || terms.interest_rate || terms.term_months);
  const approvedAmount = Number(terms.approved_amount || 0);
  const interestRate = Number(terms.interest_rate || 0);
  const termMonths = Number(terms.term_months || 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <Button type="button" variant="ghost" className="-ml-1 mb-2 min-h-10 px-2" onClick={() => router.back()} leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
          {t.common.go_back}
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-forge-2xl font-semibold text-forgeGray-800 md:text-forge-3xl">{data.applicant_name}</h1>
            <p className="mt-1 font-mono text-forge-xs text-forgeGray-500">{data.application_id}</p>
            <div className="mt-2">
              <ApplicationStatusBadge status={data.status} />
            </div>
          </div>
          {persona === "bank" ? (
            <p className="max-w-sm rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 text-forge-xs text-forgeGray-600">
              Vista seguimiento dealer: mismos datos públicos, sin paneles internos del banco.
            </p>
          ) : null}
        </div>
      </div>

      <Card className="p-5 md:p-6">
        <h2 className="font-display text-forge-md font-semibold text-forgeGray-800">Estado de tu solicitud</h2>
        {approved ? (
          <div className="mt-4 space-y-3 text-forge-sm text-forgeGray-700">
            <p className="rounded-forge-sm bg-forgeSuccess-50 px-3 py-2 text-forgeSuccess-900">
              ¡Felicitaciones! Esta solicitud fue <strong>aprobada</strong>. El banco se pondrá en contacto para los siguientes pasos de formalización y
              desembolso.
            </p>
            <p>
              Contacto de la institución: <strong>{tenantConfig.institution_name}</strong>
            </p>
            <p className="text-forge-xs text-forgeGray-500">
              Si necesitas actualizar datos de contacto del cliente, coordina con tu ejecutivo de cuenta.
            </p>
          </div>
        ) : null}
        {rejected ? (
          <div className="mt-4 space-y-3 text-forge-sm text-forgeGray-700">
            <p className="rounded-forge-sm bg-forgeDanger-50 px-3 py-2 text-forgeDanger-900">
              Esta solicitud no fue aprobada en esta ocasión. Motivo general: <strong>{rejectionCategory(data.decision)}</strong>.
            </p>
            <p>
              Puedes corregir datos o ajustar el perfil del crédito y enviar una <strong>nueva solicitud</strong> desde el panel del dealer cuando tengas la
              información actualizada.
            </p>
          </div>
        ) : null}
        {!approved && !rejected ? (
          <div className="mt-4 space-y-2 text-forge-sm text-forgeGray-700">
            <p>
              Etapa actual: <span className="font-medium text-forgeGray-900">{stageLabel(status)}</span>
            </p>
            <p className="text-forgeGray-600">
              <span className="font-medium">En cola de decisión</span> · La institución ya fue notificada.
            </p>
            <p className="text-forge-xs text-forgeGray-500">
              Si falta documentación, el banco la solicitará por los canales registrados. Revisa el historial abajo.
            </p>
          </div>
        ) : null}
      </Card>

      {hasOffer ? (
        <Card className="border-forgeSuccess-200 bg-forgeSuccess-50/30 p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-forge-md font-semibold text-forgeGray-800">
            <DollarSign className="h-5 w-5 text-forgeSuccess-600" aria-hidden />
            Oferta aprobada
          </h2>
          <dl className="grid grid-cols-3 gap-4 text-forge-sm">
            {approvedAmount > 0 ? (
              <div>
                <dt className="text-forge-xs text-forgeGray-500">Monto aprobado</dt>
                <dd className="font-mono text-forge-lg font-semibold text-forgeSuccess-800">
                  {formatForgeCurrency(approvedAmount, tenantConfig.locale, tenantConfig.currency_code)}
                </dd>
              </div>
            ) : null}
            {interestRate > 0 ? (
              <div>
                <dt className="text-forge-xs text-forgeGray-500">Tasa de interés</dt>
                <dd className="font-mono text-forge-lg font-semibold text-forgeGray-900">{interestRate}%</dd>
              </div>
            ) : null}
            {termMonths > 0 ? (
              <div>
                <dt className="text-forge-xs text-forgeGray-500">Plazo</dt>
                <dd className="font-mono text-forge-lg font-semibold text-forgeGray-900">{termMonths} meses</dd>
              </div>
            ) : null}
          </dl>

          {terms.down_payment_required ? (
            <p className="mt-3 text-forge-sm text-forgeGray-600">
              Inicial requerida: <strong className="font-mono">{formatForgeCurrency(Number(terms.down_payment_required), tenantConfig.locale, tenantConfig.currency_code)}</strong>
            </p>
          ) : null}

          {Array.isArray(terms.conditions) && terms.conditions.length > 0 ? (
            <div className="mt-3">
              <p className="text-forge-xs font-medium text-forgeGray-500">Condiciones:</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-forge-sm text-forgeGray-700">
                {(terms.conditions as string[]).map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          ) : null}

          {stipulations.length > 0 ? (
            <div className="mt-4 rounded-forge-sm border border-forge-warning/30 bg-forge-warning/5 p-3">
              <h3 className="flex items-center gap-1.5 text-forge-xs font-semibold text-forge-warning">
                <FileText className="h-4 w-4" aria-hidden />
                Estipulaciones pendientes ({stipulations.length})
              </h3>
              <ul className="mt-2 space-y-1 text-forge-sm text-forgeGray-700">
                {stipulations.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-forge-warning">&#8226;</span>
                    <span>{String(s.description || s.code || `Estipulación ${i + 1}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5">
            {acceptState === "success" ? (
              <p className="flex items-center gap-2 text-forge-sm font-medium text-forgeSuccess-700">
                <CheckCircle className="h-5 w-5" aria-hidden />
                Oferta aceptada exitosamente
              </p>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  className="min-w-[200px]"
                  disabled={acceptState === "loading"}
                  onClick={() => void handleAcceptOffer()}
                >
                  {acceptState === "loading" ? "Procesando..." : "Aceptar oferta"}
                </Button>
                {acceptState === "error" && acceptError ? (
                  <p className="mt-2 text-forge-sm text-forgeDanger-700">{acceptError}</p>
                ) : null}
              </>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="p-5 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-forge-md font-semibold text-forgeGray-800">
          <User className="h-5 w-5 text-forgeGray-500" aria-hidden />
          Cliente y monto
        </h2>
        <dl className="space-y-3 text-forge-sm">
          <div>
            <dt className="text-forge-xs text-forgeGray-500">{t.dealer.field_name}</dt>
            <dd className="text-forgeGray-900">{data.applicant_name}</dd>
          </div>
          {data.applicant_email ? (
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forgeGray-400" aria-hidden />
              <div>
                <dt className="text-forge-xs text-forgeGray-500">{t.dealer.field_email}</dt>
                <dd className="text-forgeGray-900">{data.applicant_email}</dd>
              </div>
            </div>
          ) : null}
          {data.applicant_phone ? (
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forgeGray-400" aria-hidden />
              <div>
                <dt className="text-forge-xs text-forgeGray-500">{t.dealer.field_phone}</dt>
                <dd className="text-forgeGray-900">{data.applicant_phone}</dd>
              </div>
            </div>
          ) : null}
          <div>
            <dt className="text-forge-xs text-forgeGray-500">{t.dealer.field_amount}</dt>
            <dd className="font-mono font-semibold text-forgeGray-900">{formatForgeCurrency(amount, tenantConfig.locale, tenantConfig.currency_code)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-forge-md font-semibold text-forgeGray-800">
          <Car className="h-5 w-5 text-forgeGray-500" aria-hidden />
          {t.dealer.vehicle_heading}
        </h2>
        {!data.vehicle_year && !data.vehicle_make && !data.vehicle_model && !data.vehicle_vin ? (
          <p className="text-forge-sm text-forgeGray-500">Sin información de vehículo registrada aún.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-forge-sm">
            {data.vehicle_year ? (
              <div>
                <dt className="text-forge-xs text-forgeGray-500">Año</dt>
                <dd className="text-forgeGray-900">{data.vehicle_year}</dd>
              </div>
            ) : null}
            {data.vehicle_make ? (
              <div>
                <dt className="text-forge-xs text-forgeGray-500">Marca</dt>
                <dd className="text-forgeGray-900">{data.vehicle_make}</dd>
              </div>
            ) : null}
            {data.vehicle_model ? (
              <div className="col-span-2">
                <dt className="text-forge-xs text-forgeGray-500">Modelo</dt>
                <dd className="text-forgeGray-900">{data.vehicle_model}</dd>
              </div>
            ) : null}
            {data.vehicle_vin ? (
              <div className="col-span-2">
                <dt className="text-forge-xs text-forgeGray-500">VIN</dt>
                <dd className="font-mono text-forge-sm text-forgeGray-900">{data.vehicle_vin}</dd>
              </div>
            ) : null}
          </dl>
        )}
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-forge-md font-semibold text-forgeGray-800">
          <Clock className="h-5 w-5 text-forgeGray-500" aria-hidden />
          {t.dealer.timeline_heading}
        </h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forgeBrand-500" aria-hidden />
              <div>
                <p className="font-medium text-forgeGray-900">{event.title}</p>
                {event.description ? <p className="text-forge-sm text-forgeGray-600">{event.description}</p> : null}
                <p className="text-forge-xs text-forgeGray-500">{new Date(event.created_at).toLocaleString(tenantConfig.locale)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forgeSuccess-600" aria-hidden />
            <div>
              <p className="font-medium text-forgeGray-900">{t.dealer.application_created}</p>
              <p className="text-forge-sm text-forgeGray-600">{new Date(data.created_at).toLocaleString(tenantConfig.locale)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => router.push("/credit-hub/dealer/applications")}>
          Ver todas las solicitudes
        </Button>
        <Link href="/credit-hub/dealer/applications/new/applicant" className="inline-flex min-h-10 items-center rounded-forge-sm border border-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeBrand-700 hover:bg-forgeBrand-50">
          + Nueva solicitud
        </Link>
      </div>
    </div>
  );
}
