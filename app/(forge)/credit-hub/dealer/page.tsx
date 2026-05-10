"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus, FolderOpen, ArrowRight, FileEdit, Send, CheckCircle2, TrendingUp } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Button, Card, DataTable, EmptyState, KpiCard, Skeleton } from "@/components/forge";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { cn } from "@/lib/utils";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";
import { formatForgeCurrency } from "@/utils/forge-locale";

const primaryCta =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-forge-sm border border-forgeBrand-600 bg-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeGray-50 shadow-forge-xs transition-colors hover:bg-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";

function forgeTimeGreeting(locale: string): string {
  const h = new Date().getHours();
  if (locale.toLowerCase().startsWith("es")) {
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

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
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const applicationsQuery = useCreditApplications();
  const statsQuery = useCreditStats();
  const applications = applicationsQuery.data ?? [];
  const stats = statsQuery.data;
  const isLoading = applicationsQuery.isLoading || statsQuery.isLoading;
  const error = applicationsQuery.error ?? statsQuery.error;

  const greetingName = tenantConfig.institution_name?.trim() || (tenantName && tenantName !== "—" ? tenantName : "");

  const activeRows = useMemo(() => {
    return [...applications].filter(isActivePipeline).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [applications]);

  const columns = useMemo(
    () => [
      {
        id: "applicant",
        header: "Solicitante",
        cell: (row: CreditApplication) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-forgeGray-900">{row.applicant_name || "—"}</span>
            <span className="truncate font-mono text-forge-xs text-forgeGray-500">{row.application_id}</span>
          </div>
        ),
      },
      {
        id: "amount",
        header: "Monto",
        className: "text-right tabular-nums [font-feature-settings:'tnum']",
        cell: (row: CreditApplication) => (
          <span className="font-forgeMono text-forge-sm font-medium text-forgeGray-800">
            {formatForgeCurrency(Number(row.requested_amount) || 0, tenantConfig.locale, tenantConfig.currency_code)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Estado",
        className: "w-[1%] whitespace-nowrap",
        cell: (row: CreditApplication) => <ApplicationStatusBadge status={row.status} />,
      },
      {
        id: "submitted",
        header: "Enviada",
        className: "whitespace-nowrap text-forgeGray-600",
        cell: (row: CreditApplication) => (
          <span className="text-forge-xs">
            {new Intl.DateTimeFormat(tenantConfig.locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US", {
              dateStyle: "short",
              timeStyle: "short",
            }).format(new Date(row.created_at))}
          </span>
        ),
      },
      {
        id: "action",
        header: "",
        className: "w-[1%] whitespace-nowrap text-right",
        cell: (row: CreditApplication) => (
          <Link
            href={forgeDealerApplicationDetailHref(row.application_id)}
            className="inline-flex min-h-9 min-w-[44px] items-center justify-end gap-0.5 text-forge-xs font-medium text-forgeBrand-600 hover:text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          >
            Revisar
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
    <div className="space-y-6 px-4 pt-6 pb-5 md:space-y-8 md:px-8 md:pt-8 md:pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 font-sans text-[14px] font-normal leading-snug text-forgeGray-500">
            {forgeTimeGreeting(tenantConfig.locale)}, {greetingName || "equipo"}
          </p>
          <h1
            className="font-display font-normal leading-[1.1] tracking-[-0.01em] text-forgeGray-900"
            style={{ fontSize: "clamp(32px, 4.5vw, 48px)" }}
          >
            {tenantConfig.locale.toLowerCase().startsWith("es")
              ? "Sigamos concretando aprobaciones hoy."
              : "Let's get someone approved today."}
          </h1>
          {persona === "bank" ? (
            <p className="mt-1 text-forge-xs font-medium text-forgeGray-500">Vista seguimiento dealer (misma URL, datos filtrados).</p>
          ) : null}
          <p className="mt-2 max-w-xl text-forge-sm text-forgeGray-600">
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
              <KpiCard icon={FileEdit} label="Borradores" value={String(stats?.draft_applications ?? 0)} />
              <KpiCard icon={Send} label="Enviadas" value={String(stats?.submitted_applications ?? 0)} />
              <KpiCard icon={CheckCircle2} label="Aprobadas" value={String(stats?.approved_applications ?? 0)} />
              <KpiCard
                icon={TrendingUp}
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
          <h2 className="font-display text-forge-lg font-semibold text-forgeGray-900">Mis solicitudes activas</h2>
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
            titleLevel={2}
            icon={<FolderOpen />}
            title={empty.dealerPipelineEmptyTitle}
            description={empty.dealerPipelineEmptyBody}
            action={
              <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta)}>
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {empty.dealerPipelineCta}
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
