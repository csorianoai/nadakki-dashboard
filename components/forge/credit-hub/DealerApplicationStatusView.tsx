"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Clock, Mail, Phone, User } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Button, Card, Skeleton } from "@/components/forge";
import { CreditCoreApiError } from "@/lib/credit-hub/api/creditCoreClient";
import { useCreditApplicationDetail } from "@/lib/credit-hub/hooks/useCreditApplicationDetail";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditApplicationStatus } from "@/lib/credit-hub/types/creditCore";
import { formatForgeCurrency } from "@/utils/forge-locale";

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
    default:
      return "En trámite";
  }
}

function rejectionCategory(decision: string | null): string {
  const d = (decision ?? "").toLowerCase();
  if (d.includes("declin") || d.includes("reject")) return "Política de crédito o capacidad de pago";
  return "No aprobada en esta ocasión";
}

export function DealerApplicationStatusView({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const t = useTranslations();
  const persona = usePersona();
  const { tenantConfig } = useTenantConfig();
  const { application: data, events, isLoading, error, refetch } = useCreditApplicationDetail(applicationId);

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
  const approved = status === "approved" || data.decision === "approved";
  const rejected = status === "rejected" || status === "declined" || data.decision === "rejected" || data.decision === "declined";

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
              Tiempo estimado de respuesta: <span className="font-medium">3 a 5 días hábiles</span> desde la última actualización.
            </p>
            <p className="text-forge-xs text-forgeGray-500">
              Si falta documentación, el banco la solicitará por los canales registrados. Revisa el historial abajo.
            </p>
          </div>
        ) : null}
      </Card>

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
