"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { EmptyStateRich, TableSkeleton } from "@/components/credit-hub/primitives";
import { DealerAppCard, DealerSectionHeader } from "@/components/credit-hub/dealer/shared/dealerUi";
import type { DealerApplicationsListViewProps } from "@/lib/credit-hub/types/dealer-views";
import { dealerDetailHref } from "@/lib/credit-hub/dealer/dealerFormat";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "draft", label: "Borrador" },
  { id: "submitted", label: "Enviadas" },
  { id: "processing", label: "En proceso" },
  { id: "approved", label: "Aprobadas" },
  { id: "rejected", label: "Rechazadas" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function DealerApplicationsListView({
  applications,
  currency = "MXN",
  isLoading,
  isError,
  onRetry,
}: DealerApplicationsListViewProps & { currency?: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    let rows = applications;
    if (filter !== "all") rows = rows.filter((a) => a.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      rows = rows.filter(
        (a) =>
          a.applicant_name?.toLowerCase().includes(q) ||
          a.application_id.toLowerCase().includes(q) ||
          a.vehicle_make?.toLowerCase().includes(q) ||
          a.vehicle_model?.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [applications, filter, query]);

  if (isLoading) return <TableSkeleton rows={6} />;

  if (isError) {
    return (
      <EmptyStateRich
        variant="error"
        primary={
          <button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>
            Reintentar
          </button>
        }
      />
    );
  }

  return (
    <div>
      <DealerSectionHeader
        title="Solicitudes"
        sub={`${filtered.length} en vista`}
        action={
          <Link href="/credit-hub/dealer/applications/new/applicant" className="ch-btn ch-btn-persona ch-btn-sm hidden sm:inline-flex" style={{ textDecoration: "none" }}>
            <Plus className="h-4 w-4" aria-hidden />
            Nueva
          </Link>
        }
      />

      <div style={{ marginBottom: 14 }}>
        <label className="ch-label" htmlFor="dealer-apps-search">
          Buscar
        </label>
        <div style={{ position: "relative" }}>
          <Search
            className="h-4 w-4"
            aria-hidden
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ch-text-3)" }}
          />
          <input
            id="dealer-apps-search"
            className="ch-input"
            style={{ paddingLeft: 36, minHeight: 44, width: "100%" }}
            placeholder="Nombre, folio o vehículo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div role="toolbar" aria-label="Filtros por estado" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const count = f.id === "all" ? applications.length : applications.filter((a) => a.status === f.id).length;
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.id)}
              className="ch-btn ch-btn-sm"
              style={{
                background: on ? "var(--ch-persona-soft)" : "var(--ch-surface-2)",
                color: on ? "var(--ch-persona-text)" : "var(--ch-text-2)",
                border: on ? "1px solid var(--ch-persona-line)" : "1px solid var(--ch-line)",
                minHeight: 44,
              }}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyStateRich
          variant="empty"
          title={query || filter !== "all" ? "Sin resultados" : "Sin solicitudes"}
          description="Ajusta filtros o crea una nueva solicitud."
          primary={
            <Link href="/credit-hub/dealer/applications/new/applicant" className="ch-btn ch-btn-persona">
              Nueva solicitud
            </Link>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {filtered.map((app: CreditApplication) => (
            <DealerAppCard key={app.application_id} app={app} currency={currency} href={dealerDetailHref(app.application_id)} />
          ))}
        </div>
      )}

      <Link
        href="/credit-hub/dealer/applications/new/applicant"
        className="ch-btn ch-btn-persona fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full sm:hidden"
        style={{ position: "fixed", borderRadius: 999, padding: 0, minWidth: 56, minHeight: 56 }}
        aria-label="Nueva solicitud"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}
