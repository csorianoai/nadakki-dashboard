"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Inbox, AlertCircle, ArrowRight } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { PullToRefresh } from "@/components/credit-hub/system/PullToRefresh";
import {
  Button,
  DataTable,
  type DataTableDensity,
  EmptyState,
  Input,
  Select,
  Skeleton,
} from "@/components/forge";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { cn } from "@/lib/utils";
import { formatForgeCurrency } from "@/utils/forge-locale";
import { forgeEmptyCopy } from "@/utils/forge-empty-copy";

function formatShortDateTime(iso: string, locale: string): string {
  try {
    const l = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
    return new Intl.DateTimeFormat(l, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatSyncAge(dataUpdatedAt: number | undefined, locale: string): string {
  if (dataUpdatedAt == null || Number.isNaN(dataUpdatedAt)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - dataUpdatedAt) / 1000));
  const loc = locale.toLowerCase().startsWith("es") ? "es-DO" : "en-US";
  const rtf = new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  if (sec < 45) return rtf.format(-sec, "second");
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, "minute");
  const hr = Math.floor(min / 60);
  if (hr < 72) return rtf.format(-hr, "hour");
  const day = Math.floor(hr / 24);
  return rtf.format(-day, "day");
}

const FILTER_IDS = ["all", "draft", "submitted", "processing", "approved", "rejected"] as const;
type FilterId = (typeof FILTER_IDS)[number];

function isFilterId(s: string | null): s is FilterId {
  return s !== null && (FILTER_IDS as readonly string[]).includes(s);
}

function parseDensity(raw: string | null): DataTableDensity {
  if (raw === "compact" || raw === "dense" || raw === "comfortable") return raw;
  return "compact";
}

function buildQueryString(q: string, status: FilterId, density: DataTableDensity): string {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (status !== "all") p.set("status", status);
  if (density !== "compact") p.set("density", density);
  return p.toString();
}

const primaryCta =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-forge-sm border border-forgeBrand-600 bg-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeGray-50 shadow-forge-xs transition-colors hover:bg-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";

const densitySelectOptions: { value: DataTableDensity; label: string }[] = [
  { value: "comfortable", label: "Cómoda" },
  { value: "compact", label: "Compacta" },
  { value: "dense", label: "Densa" },
];

function ListSkeleton() {
  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="h-10 w-48 rounded-forge-md" />
      <Skeleton className="h-12 w-full max-w-xl rounded-forge-md" />
      <Skeleton className="h-12 w-full rounded-forge-md" />
      <Skeleton className="h-48 w-full rounded-forge-md" />
    </div>
  );
}

function DealerApplicationsListInner() {
  const persona = usePersona();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenantConfig } = useTenantConfig();
  const empty = forgeEmptyCopy(tenantConfig.locale);
  const applicationsQuery = useCreditApplications();
  const { data: applications = [], isLoading, error, refetch } = applicationsQuery;

  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: t.dealer.applications_filters.all },
        { id: "draft" as const, label: t.dealer.applications_filters.draft },
        { id: "submitted" as const, label: t.dealer.applications_filters.submitted },
        { id: "processing" as const, label: t.dealer.applications_filters.processing },
        { id: "approved" as const, label: t.dealer.applications_filters.approved },
        { id: "rejected" as const, label: t.dealer.applications_filters.rejected },
      ] as const,
    [t]
  );

  const [activeFilter, setActiveFilter] = useState<FilterId>(() =>
    isFilterId(searchParams.get("status")) ? (searchParams.get("status") as FilterId) : "all"
  );
  const [density, setDensity] = useState<DataTableDensity>(() => parseDensity(searchParams.get("density")));
  const [inputQ, setInputQ] = useState(() => searchParams.get("q") ?? "");

  useEffect(() => {
    setInputQ(searchParams.get("q") ?? "");
    const s = searchParams.get("status");
    setActiveFilter(isFilterId(s) ? (s as FilterId) : "all");
    setDensity(parseDensity(searchParams.get("density")));
  }, [searchParams]);

  const replaceQuery = useCallback(
    (q: string, status: FilterId, d: DataTableDensity) => {
      const qs = buildQueryString(q, status, d);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (inputQ.trim() === urlQ.trim()) return;
    const id = window.setTimeout(() => {
      replaceQuery(inputQ, activeFilter, density);
    }, 400);
    return () => window.clearTimeout(id);
  }, [inputQ, activeFilter, density, replaceQuery, searchParams]);

  const filtered = useMemo(() => {
    let result = applications;

    if (activeFilter !== "all") {
      result = result.filter((application) => application.status === activeFilter);
    }

    if (inputQ.trim()) {
      const query = inputQ.toLowerCase().trim();
      result = result.filter(
        (application) =>
          application.applicant_name.toLowerCase().includes(query) ||
          application.application_id.toLowerCase().includes(query) ||
          application.id.toLowerCase().includes(query) ||
          application.vehicle_make?.toLowerCase().includes(query) ||
          application.vehicle_model?.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeFilter, applications, inputQ]);

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
        id: "vehicle",
        header: "Vehículo",
        cell: (row: CreditApplication) => (
          <span className="text-forgeGray-600">
            {[row.vehicle_year, row.vehicle_make, row.vehicle_model].filter(Boolean).join(" ") || "—"}
          </span>
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
          <span className="text-forge-xs">{formatShortDateTime(row.created_at, tenantConfig.locale)}</span>
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

  const hasActiveFilters = inputQ.trim().length > 0 || activeFilter !== "all";

  const clearFilters = () => {
    setInputQ("");
    setActiveFilter("all");
    replaceQuery("", "all", density);
  };

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
    >
      <div className="space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-8" data-persona={persona}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h1
                className="min-w-0 font-display font-normal leading-tight tracking-[-0.01em] text-forgeGray-900"
                style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
              >
                Solicitudes
              </h1>
              <p className="shrink-0 font-sans text-[13px] text-forgeGray-600 sm:text-right">
                <span className="font-medium tabular-nums text-forgeGray-700">{filtered.length}</span>
                <span className="text-forgeGray-500"> en vista · Última sync: </span>
                <span>{formatSyncAge(applicationsQuery.dataUpdatedAt, tenantConfig.locale)}</span>
              </p>
            </div>
            {persona === "bank" ? (
              <p className="mt-1 text-forge-xs font-medium text-forgeGray-500">Vista seguimiento dealer (misma URL, datos filtrados).</p>
            ) : null}
            <p className="mt-2 max-w-xl text-forge-sm text-forgeGray-600">Historial completo con búsqueda y filtros por estado.</p>
          </div>
          <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta, "hidden md:inline-flex")}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nueva solicitud
          </Link>
        </header>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="min-w-0 flex-1">
            <Input
              name="applications-search"
              label="Buscar"
              placeholder={t.dealer.applications_search_placeholder}
              value={inputQ}
              onChange={(e) => setInputQ(e.target.value)}
              prefix={<Search className="h-4 w-4 shrink-0" aria-hidden />}
            />
          </div>
          <div className="w-full shrink-0 md:max-w-xs">
            <Select
              name="applications-table-density"
              label="Densidad de la tabla"
              value={density}
              onChange={(e) => {
                const next = e.target.value as DataTableDensity;
                setDensity(next);
                replaceQuery(inputQ, activeFilter, next);
              }}
              options={densitySelectOptions}
            />
          </div>
        </div>

        <div role="toolbar" aria-label="Filtros por estado" className="flex flex-wrap gap-1.5 rounded-forge-md bg-forgeSurface-sunken p-1">
          {filters.map((filter) => {
            const count =
              filter.id === "all" ? applications.length : applications.filter((application) => application.status === filter.id).length;
            const selected = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setActiveFilter(filter.id);
                  replaceQuery(inputQ, filter.id, density);
                }}
                className={cn(
                  "rounded-forge-sm px-3 py-2 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                  selected ? "bg-forgeSurface-card text-forgeGray-800 shadow-forge-xs" : "text-forgeGray-600 hover:text-forgeGray-800"
                )}
              >
                {filter.label} <span className="tabular-nums text-forgeGray-500">({count})</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-forge-md" />
            <Skeleton className="h-12 w-full rounded-forge-md" />
            <Skeleton className="h-12 w-full rounded-forge-md" />
          </div>
        ) : error ? (
          <EmptyState
            titleLevel={2}
            icon={<AlertCircle className="text-forgeDanger-500" />}
            title={empty.dealerListErrorTitle}
            description={empty.dealerListErrorBody}
            action={
              <Button type="button" variant="secondary" className="min-h-11" onClick={() => void refetch()}>
                {t.common.retry}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            titleLevel={2}
            icon={hasActiveFilters ? <Search /> : <Inbox />}
            title={hasActiveFilters ? empty.dealerListFilteredTitle : empty.dealerListZeroTitle}
            description={hasActiveFilters ? empty.dealerListFilteredBody : empty.dealerListZeroBody}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="secondary" className="min-h-11" onClick={clearFilters}>
                  {empty.dealerListFilteredCta}
                </Button>
              ) : (
                <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta)}>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  {empty.dealerListZeroCta}
                </Link>
              )
            }
          />
        ) : (
          <DataTable<CreditApplication>
            getRowId={(r) => r.application_id}
            rows={filtered}
            columns={columns}
            emptyLabel="Sin filas"
            density={density}
            className="text-forge-xs md:text-forge-sm"
          />
        )}

        <Link
          href="/credit-hub/dealer/applications/new/applicant"
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-forgeBrand-500 text-forgeGray-50 shadow-forge-md md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          aria-label="Nueva solicitud"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Link>
      </div>
    </PullToRefresh>
  );
}

export default function DealerApplicationsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <DealerApplicationsListInner />
    </Suspense>
  );
}
