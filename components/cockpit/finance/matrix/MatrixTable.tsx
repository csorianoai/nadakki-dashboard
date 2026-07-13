"use client";

import { useMemo, useState } from "react";
import type { FinanceMatrixResponse, MatrixRow } from "@/lib/cockpit/finance-v3/contracts/matrix";
import { MatrixCellView } from "./MatrixCellView";

type SortKey = "tenant_name" | "plan_code" | "country" | "row_total";

export function MatrixTable({
  matrix,
  onRetry,
}: {
  matrix: FinanceMatrixResponse;
  onRetry?: () => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("tenant_name");
  const [sortAsc, setSortAsc] = useState(true);

  const coreCodes = useMemo(() => {
    const codes = new Set<string>();
    matrix.rows.forEach((r) => r.cells.forEach((c) => codes.add(c.core_code)));
    return Array.from(codes);
  }, [matrix.rows]);

  const sortedRows = useMemo(() => {
    const rows = [...matrix.rows];
    rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "row_total") {
        av = a.row_total?.value ?? -1;
        bv = b.row_total?.value ?? -1;
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return rows;
  }, [matrix.rows, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (!matrix.rows.length) {
    return (
      <div
        className="rounded-xl border border-dashed border-cockpit-border p-8 text-center"
        data-testid="matrix-empty"
      >
        <p className="text-sm text-cockpit-muted">Sin tenants que coincidan con los filtros.</p>
        <p className="mt-2 text-xs text-cockpit-muted">
          Ajusta país, plan o core habilitado — o verifica suscripciones en Ingresos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-cockpit-border" data-testid="matrix-table">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-cockpit-surface text-xs uppercase text-cockpit-muted">
            <th
              className="sticky left-0 z-20 bg-cockpit-surface px-3 py-2 text-left"
              onClick={() => toggleSort("tenant_name")}
            >
              Tenant {sortKey === "tenant_name" ? (sortAsc ? "↑" : "↓") : ""}
            </th>
            <th className="sticky left-32 z-20 bg-cockpit-surface px-3 py-2 text-left" onClick={() => toggleSort("plan_code")}>
              Plan
            </th>
            <th className="px-3 py-2 text-left" onClick={() => toggleSort("country")}>
              País
            </th>
            {coreCodes.map((code) => (
              <th key={code} className="sticky top-0 z-10 bg-cockpit-surface px-3 py-2 text-right">
                {code}
              </th>
            ))}
            {matrix.aggregation_type !== "NON_ADDITIVE" ? (
              <th className="px-3 py-2 text-right" onClick={() => toggleSort("row_total")}>
                Total
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <MatrixRowView
              key={row.tenant_id}
              row={row}
              coreCodes={coreCodes}
              showRowTotal={matrix.aggregation_type !== "NON_ADDITIVE"}
              onRetry={onRetry}
            />
          ))}
        </tbody>
        {matrix.totals_per_column.length > 0 ? (
          <tfoot>
            <tr className="border-t border-cockpit-border bg-cockpit-surface/80 font-medium">
              <td className="sticky left-0 bg-cockpit-surface px-3 py-2" colSpan={3}>
                Totales columna
              </td>
              {coreCodes.map((code) => {
                const t = matrix.totals_per_column.find((c) => c.core_code === code);
                return (
                  <td key={code} className="px-3 py-2 text-right tabular-nums">
                    {t?.display_value ?? "—"}
                  </td>
                );
              })}
              {matrix.aggregation_type !== "NON_ADDITIVE" ? (
                <td className="px-3 py-2 text-right tabular-nums">
                  {matrix.grand_total?.display_value ?? "—"}
                </td>
              ) : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

function MatrixRowView({
  row,
  coreCodes,
  showRowTotal,
  onRetry,
}: {
  row: MatrixRow;
  coreCodes: string[];
  showRowTotal: boolean;
  onRetry?: () => void;
}) {
  const cellMap = new Map(row.cells.map((c) => [c.core_code, c]));

  return (
    <tr className="border-t border-cockpit-border hover:bg-cockpit-border/10 group">
      <td className="sticky left-0 z-10 bg-cockpit-bg px-3 py-2 font-medium">{row.tenant_name}</td>
      <td className="sticky left-32 z-10 bg-cockpit-bg px-3 py-2 text-cockpit-muted">{row.plan_code}</td>
      <td className="px-3 py-2">{row.country}</td>
      {coreCodes.map((code) => {
        const cell = cellMap.get(code);
        return (
          <td key={code} className="px-3 py-2 text-right">
            {cell ? (
              <MatrixCellView cell={cell} tenantSlug={row.tenant_slug} onRetry={onRetry} />
            ) : (
              <span className="text-cockpit-muted">—</span>
            )}
          </td>
        );
      })}
      {showRowTotal ? (
        <td
          className="px-3 py-2 text-right tabular-nums opacity-70 group-hover:opacity-100"
          title="Total fila"
        >
          {row.row_total?.display_value ?? "—"}
        </td>
      ) : null}
    </tr>
  );
}
