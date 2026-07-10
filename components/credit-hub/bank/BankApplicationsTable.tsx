"use client";

import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { forgeToast } from "@/components/credit-hub/system/ForgeToaster";
import { BulkActionBar, EmptyStateRich, TableSkeleton } from "@/components/credit-hub/primitives";
import { BankSegment, QueueTable, SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { CHApiError, resolveCreditHubFetchUrl } from "@/lib/credit-hub/api/client";
import { bankQueueExcelPath } from "@/lib/credit-hub/api/bankExperienceClient";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { BankApplicationsTableProps } from "@/lib/credit-hub/types/bank-views";
import type { BankQueueSortKey } from "@/lib/credit-hub/types/bank-views";
import { sortQueueItems } from "@/lib/credit-hub/bank/bankFormat";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

const LEGACY_TOKEN_KEY = "nadakki_sic_token";

export interface BankApplicationsTableBulkProps extends BankApplicationsTableProps {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onClearSelection: () => void;
  onBulkApply?: () => void;
  bulkVisible?: boolean;
}

export function BankApplicationsTable({
  items,
  total,
  page,
  pageSize,
  search,
  isLoading,
  isError,
  onSearchChange,
  onPageChange,
  onRetry,
  selected,
  onToggle,
  onToggleAll,
  onClearSelection,
  onBulkApply,
}: BankApplicationsTableBulkProps) {
  const { apiTenantId } = useTenant();
  const [estado, setEstado] = useState("all");
  const [prio, setPrio] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [sortKey, setSortKey] = useState<BankQueueSortKey>("priority");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    let r = items.filter((a) => {
      if (estado === "pending" && a.state !== "submitted" && a.state !== "SUBMITTED") return false;
      if (estado === "review" && a.state !== "claimed" && a.state !== "CLAIMED") return false;
      if (estado === "decided" && a.state !== "decided" && a.state !== "DECIDED") return false;
      if (prio !== "all" && a.priority !== prio) return false;
      if (minScore && a.score < Number(minScore)) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (![a.applicant_name, a.application_id, a.dealer_name].some((v) => String(v ?? "").toLowerCase().includes(s))) return false;
      }
      return true;
    });
    r = sortQueueItems(r, sortKey, sortDir);
    return r;
  }, [items, estado, prio, minScore, search, sortKey, sortDir]);

  const hasFilters = estado !== "all" || prio !== "all" || minScore !== "" || search.trim() !== "";
  const clearFilters = () => {
    setEstado("all");
    setPrio("all");
    setMinScore("");
    onSearchChange("");
  };

  const onSort = (k: BankQueueSortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "score" || k === "requested_amount" ? "desc" : "asc");
    }
  };

  const exportExcel = async () => {
    if (!apiTenantId || exporting) return;
    setExporting(true);
    try {
      const token =
        tokenStorage.getAccessToken() ??
        (typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_TOKEN_KEY) : null);
      const res = await fetch(resolveCreditHubFetchUrl(bankQueueExcelPath()), {
        headers: {
          "X-Tenant-ID": apiTenantId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        if (res.status === 404 || res.status === 501) {
          forgeToast.error("Exportación Excel no disponible aún");
          return;
        }
        throw new CHApiError(`Error ${res.status}`, res.status);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "cola-banco.xlsx";
      a.click();
      URL.revokeObjectURL(objectUrl);
      forgeToast.success("Excel descargado");
    } catch (err) {
      forgeToast.error(err instanceof CHApiError ? err.detail : "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <TableSkeleton rows={8} />;
  if (isError) return <EmptyStateRich variant="error" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={onRetry}>Reintentar</button>} />;

  return (
    <div style={{ paddingBottom: selected.size ? 80 : 0 }}>
      <SectionHeader
        eyebrow="Bank · Solicitudes"
        title="Solicitudes priorizadas"
        sub={`${total} solicitudes en el tenant · ${filtered.length} visibles`}
        actions={
          <button
            type="button"
            className="ch-btn ch-btn-secondary ch-btn-sm"
            disabled={exporting}
            onClick={() => void exportExcel()}
            data-testid="export-queue-excel-btn"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {exporting ? "Exportando…" : "Exportar Excel"}
          </button>
        }
      />

      <div className="ch-card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ch-eyebrow">Estado</span>
            <BankSegment value={estado} onChange={setEstado} options={[{ v: "all", l: "Todos" }, { v: "pending", l: "Pendientes" }, { v: "review", l: "En revisión" }, { v: "decided", l: "Decididas" }]} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ch-eyebrow">Prioridad</span>
            <BankSegment value={prio} onChange={setPrio} options={[{ v: "all", l: "Todas" }, { v: "ALTA", l: "Alta" }, { v: "MEDIA", l: "Media" }, { v: "BAJA", l: "Baja" }]} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="ch-eyebrow">Score ≥</span>
            <input className="ch-input ch-mono" value={minScore} onChange={(e) => setMinScore(e.target.value.replace(/\D/g, ""))} placeholder="300" style={{ width: 72, height: 28 }} />
          </div>
          {hasFilters ? (
            <button type="button" className="ch-btn ch-btn-ghost ch-btn-sm" style={{ marginLeft: "auto", color: "var(--ch-accent-text)" }} onClick={clearFilters}>
              <X className="h-3 w-3" aria-hidden />
              Limpiar filtros
            </button>
          ) : null}
        </div>
        <div style={{ position: "relative", marginTop: 12 }}>
          <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--ch-text-4)" }} aria-hidden />
          <input className="ch-input" style={{ paddingLeft: 32 }} placeholder="Buscar por nombre, ID o concesionario…" value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        hasFilters ? <EmptyStateRich variant="filter-empty" primary={<button type="button" className="ch-btn ch-btn-secondary" onClick={clearFilters}>Limpiar filtros</button>} /> : <EmptyStateRich variant="empty" />
      ) : (
        <div className="ch-card" style={{ overflow: "hidden" }}>
          <QueueTable items={filtered} variant="list" selectable selected={selected} onToggle={onToggle} onToggleAll={onToggleAll} sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--ch-line)", fontSize: 12, color: "var(--ch-text-3)" }}>
            <span className="ch-mono">
              Mostrando {filtered.length} de {total}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                Anterior
              </button>
              <span className="ch-mono" style={{ padding: "0 8px" }}>
                {page} / {Math.max(1, Math.ceil(total / pageSize))}
              </span>
              <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" disabled={page >= Math.ceil(total / pageSize)} onClick={() => onPageChange(page + 1)}>
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {selected.size > 0 ? (
        <div style={{ position: "sticky", bottom: 16, marginTop: 16, zIndex: 5 }}>
          <BulkActionBar count={selected.size} onClear={onClearSelection} onApply={onBulkApply} />
        </div>
      ) : null}
    </div>
  );
}
