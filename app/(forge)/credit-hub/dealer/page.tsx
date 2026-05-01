"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Button, Card, DataTable, EmptyState, KpiCard, Skeleton } from "@/components/forge";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { cn } from "@/lib/utils";
import { formatForgeCurrency } from "@/utils/forge-locale";

const primaryCta =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-forge-sm border border-forgeBrand-600 bg-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeInk-50 shadow-forge-xs transition-colors hover:bg-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";

function volumeThisMonth(applications: CreditApplication[], locale: string, currency: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let sum = 0;
  for (const app of applications) {
    const d = new Date(app.created_at);
    if (d.getFullYear() === y && d.getMonth() === m) {
      sum += Number(app.requested_amount) || 0;
    }
  }
  return formatForgeCurrency(sum, locale, currency);
}

function isActivePipeline(app: CreditApplication): boolean {
  return !["draft", "rejected", "declined", "cancelled"].includes(app.status);
}

export default function DealerDashboardPage() {
  const persona = usePersona();
  const { tenantName } = useAuth();
  const { tenantConfig } = useTenantConfig();
  const applicationsQuery = useCreditApplications();
  const statsQuery = useCreditStats();
  const applications = applicationsQuery.data ?? [];
  const stats = statsQuery.data;
  const isLoading = applicationsQuery.isLoading || statsQuery.isLoading;
  const error = applicationsQuery.error ?? statsQuery.error;

  const greetingName = tenantName && tenantName !== "—" ? tenantName : "there";

  const activeRows = useMemo(() => {
    return [...applications].filter(isActivePipeline).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [applications]);

  const columns = useMemo(
    () => [
      {
        id: "applicant",
        header: "Solicitante",
        cell: (row: CreditApplication) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-forgeInk-900">{row.applicant_name || "—"}</span>
            <span className="truncate font-mono text-forge-xs text-forgeInk-500">{row.application_id}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Estado",
        className: "w-[1%] whitespace-nowrap",
        cell: (row: CreditApplication) => <ApplicationStatusBadge status={row.status} />,
      },
      {
        id: "amount",
        header: "Monto",
        className: "w-[1%] whitespace-nowrap text-right font-mono text-forge-xs",
        cell: (row: CreditApplication) =>
          formatForgeCurrency(Number(row.requested_amount) || 0, tenantConfig.locale, tenantConfig.currency_code),
      },
      {
        id: "action",
        header: "",
        className: "w-[1%] whitespace-nowrap",
        cell: (row: CreditApplication) => (
          <Link
            href={`/credit-hub/dealer/applications/${row.application_id}`}
            className="text-forge-xs font-medium text-forgeBrand-600 hover:underline"
          >
            Ver
          </Link>
        ),
      },
    ],
    [tenantConfig.currency_code, tenantConfig.locale]
  );

  const retry = () => {
    void applicationsQuery.refetch();
    void statsQuery.refetch();
  };

  return (
    <div className="space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-forge-2xl font-semibold leading-tight text-forgeInk-900 md:text-forge-3xl">
            Hi {greetingName}. Let&apos;s get someone approved today.
          </h1>
          {persona === "bank" ? (
            <p className="mt-1 text-forge-xs font-medium text-forgeInk-500">Vista seguimiento dealer (misma URL, datos filtrados).</p>
          ) : null}
          <p className="mt-2 max-w-xl text-forge-sm text-forgeInk-600">
            Revisa el embudo, abre solicitudes activas y envía una nueva cuando tengas al cliente listo.
          </p>
        </div>
        <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta)}>
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          + Nueva solicitud
        </Link>
      </header>

      <section aria-label="Indicadores del mes">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-forge-md" />
              ))}
            </>
          ) : (
            <>
              <KpiCard label="Borradores" value={String(stats?.draft_applications ?? 0)} />
              <KpiCard label="Enviadas" value={String(stats?.submitted_applications ?? 0)} />
              <KpiCard label="Aprobadas" value={String(stats?.approved_applications ?? 0)} />
              <KpiCard
                label="Volumen este mes"
                value={volumeThisMonth(applications, tenantConfig.locale, tenantConfig.currency_code)}
                hint="Suma de montos solicitados (solicitudes creadas este mes)"
              />
            </>
          )}
        </div>
      </section>

      <section aria-label="Solicitudes activas">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-forge-lg font-semibold text-forgeInk-900">Mis solicitudes activas</h2>
          <Link href="/credit-hub/dealer/applications" className="text-forge-xs font-medium text-forgeBrand-600 hover:underline">
            Ver historial completo
          </Link>
        </div>
        {isLoading ? (
          <Skeleton className="h-48 w-full rounded-forge-md" />
        ) : error ? (
          <Card className="p-6 text-center">
            <p className="text-forge-sm text-forgeDanger-700">No se pudieron cargar los datos.</p>
            <Button type="button" variant="secondary" className="mt-4 min-h-11" onClick={retry}>
              Reintentar
            </Button>
          </Card>
        ) : activeRows.length === 0 ? (
          <EmptyState
            title="Sin solicitudes activas"
            description="Cuando envíes o tengas solicitudes en proceso, aparecerán aquí."
            action={
              <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta)}>
                + Nueva solicitud
              </Link>
            }
          />
        ) : (
          <DataTable<CreditApplication>
            getRowId={(r) => r.application_id}
            rows={activeRows}
            columns={columns}
            emptyLabel="Sin filas"
            className="text-forge-xs md:text-forge-sm"
          />
        )}
      </section>
    </div>
  );
}
