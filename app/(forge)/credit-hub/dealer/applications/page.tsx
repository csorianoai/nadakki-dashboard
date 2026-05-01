"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/credit-hub/dealer/ApplicationStatusBadge";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { PullToRefresh } from "@/components/credit-hub/system/PullToRefresh";
import {
  Button,
  Card,
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

const FILTER_IDS = ["all", "draft", "submitted", "processing", "approved", "rejected"] as const;
type FilterId = (typeof FILTER_IDS)[number];

function isFilterId(s: string | null): s is FilterId {
  return s !== null && (FILTER_IDS as readonly string[]).includes(s);
}

function parseDensity(raw: string | null): DataTableDensity {
  if (raw === "compact" || raw === "dense" || raw === "comfortable") return raw;
  return "comfortable";
}

function buildQueryString(q: string, status: FilterId, density: DataTableDensity): string {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (status !== "all") p.set("status", status);
  if (density !== "comfortable") p.set("density", density);
  return p.toString();
}

const primaryCta =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-forge-sm border border-forgeBrand-600 bg-forgeBrand-500 px-4 text-forge-sm font-medium text-forgeInk-50 shadow-forge-xs transition-colors hover:bg-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500 sm:w-auto";

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
  const { data: applications = [], isLoading, error, refetch } = useCreditApplications();

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
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium text-forgeInk-900">{row.applicant_name || "—"}</span>
            <span className="truncate font-mono text-forge-xs text-forgeInk-500">{row.application_id}</span>
          </div>
        ),
      },
      {
        id: "vehicle",
        header: "Vehículo",
        cell: (row: CreditApplication) => (
          <span className="text-forgeInk-600">
            {[row.vehicle_year, row.vehicle_make, row.vehicle_model].filter(Boolean).join(" ") || "—"}
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
            href={forgeDealerApplicationDetailHref(row.application_id)}
            className="inline-flex min-h-12 min-w-[44px] items-center text-forge-xs font-medium text-forgeBrand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
          >
            Ver
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
          <div className="min-w-0">
            <h1 className="font-display text-forge-2xl font-semibold text-forgeInk-900 md:text-forge-3xl">Solicitudes</h1>
            {persona === "bank" ? (
              <p className="mt-1 text-forge-xs font-medium text-forgeInk-500">Vista seguimiento dealer (misma URL, datos filtrados).</p>
            ) : null}
            <p className="mt-2 max-w-xl text-forge-sm text-forgeInk-600">Historial completo con búsqueda y filtros por estado.</p>
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
                  selected ? "bg-forgeSurface-card text-forgeInk-800 shadow-forge-xs" : "text-forgeInk-600 hover:text-forgeInk-800"
                )}
              >
                {filter.label} <span className="tabular-nums text-forgeInk-500">({count})</span>
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
          <Card className="p-6 text-center">
            <p className="text-forge-sm text-forgeDanger-700">Error al cargar solicitudes reales</p>
            <p className="mt-1 text-forge-sm text-forgeInk-500">Inténtalo de nuevo en un momento</p>
            <Button type="button" variant="secondary" className="mt-4 min-h-11" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            titleLevel={2}
            title={hasActiveFilters ? "No hay solicitudes que coincidan con estos filtros" : "Aún no hay solicitudes"}
            description={
              hasActiveFilters
                ? "Prueba otras palabras en la búsqueda o restablece los filtros para ver todo el historial."
                : "Cuando crees solicitudes, aparecerán aquí con su estado y monto."
            }
            action={
              hasActiveFilters ? (
                <Button type="button" variant="secondary" className="min-h-11" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Link href="/credit-hub/dealer/applications/new/applicant" className={cn(primaryCta)}>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Crear solicitud
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
          className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-forgeBrand-500 text-forgeInk-50 shadow-forge-md md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
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
