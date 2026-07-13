import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import { normalizeFinanceMatrix } from "@/lib/cockpit/finance-v3/normalize/matrix";
import type {
  FinanceMatrixResponse,
  MatrixMetric,
  MatrixPeriod,
} from "@/lib/cockpit/finance-v3/contracts/matrix";

export type MatrixFetchResult =
  | { status: "ok"; data: FinanceMatrixResponse }
  | { status: "error"; error: string; statusCode?: number };

export type MatrixQuery = {
  metric?: MatrixMetric;
  period?: MatrixPeriod;
  row_limit?: number;
  row_cursor?: string | null;
  country?: string | null;
  plan_code?: string | null;
  core_enabled?: string | null;
};

export async function fetchFinanceMatrix(query: MatrixQuery = {}): Promise<MatrixFetchResult> {
  const q = new URLSearchParams();
  if (query.metric) q.set("metric", query.metric);
  if (query.period) q.set("period", query.period);
  if (query.row_limit) q.set("row_limit", String(query.row_limit));
  if (query.row_cursor) q.set("row_cursor", query.row_cursor);
  if (query.country) q.set("country", query.country);
  if (query.plan_code) q.set("plan_code", query.plan_code);
  if (query.core_enabled) q.set("core_enabled", query.core_enabled);

  const suffix = q.size ? `?${q.toString()}` : "";
  try {
    const raw = await platformFetch<unknown>(`/api/v1/cockpit/finance/matrix${suffix}`);
    return { status: "ok", data: normalizeFinanceMatrix(raw) };
  } catch (err) {
    if (err instanceof PlatformApiError) {
      return { status: "error", error: err.message, statusCode: err.status };
    }
    return { status: "error", error: err instanceof Error ? err.message : "Error de red" };
  }
}

/** Reconcile matrix MRR column totals vs Revenue F2 mrr-by-core. */
export function reconcileMatrixMrrWithRevenue(
  matrix: FinanceMatrixResponse,
  revenueCoreMrr: { core_name: string; mrr: number }[],
): { ok: boolean; warnings: { code: string; severity: string; message: string }[] } {
  const warnings: { code: string; severity: string; message: string }[] = [];
  if (matrix.metric !== "mrr") return { ok: true, warnings };

  const byCore = new Map(revenueCoreMrr.map((c) => [c.core_name, c.mrr]));
  for (const col of matrix.totals_per_column) {
    if (col.core_code === "unallocated_mrr") continue;
    const expected = byCore.get(col.core_code) ?? 0;
    const actual = col.value ?? 0;
    if (Math.abs(expected - actual) > 0.01) {
      warnings.push({
        code: "RECONCILIATION_MISMATCH",
        severity: "error",
        message: `MRR ${col.core_code}: matriz=${actual} vs ingresos=${expected}`,
      });
    }
  }
  return { ok: warnings.length === 0, warnings };
}

export function matrixToCsv(matrix: FinanceMatrixResponse): string {
  const coreCodes = Array.from(
    new Set(matrix.rows.flatMap((r) => r.cells.map((c) => c.core_code))),
  );
  const headers = [
    "tenant_slug",
    "tenant_name",
    "plan_code",
    "country",
    ...coreCodes,
    "row_total",
  ];
  const lines = [headers.join(",")];
  for (const row of matrix.rows) {
    const cellMap = new Map(row.cells.map((c) => [c.core_code, c.display_value]));
    const cols = coreCodes.map((code) => {
      const v = cellMap.get(code) ?? "—";
      return `"${String(v).replace(/"/g, '""')}"`;
    });
    lines.push(
      [
        `"${row.tenant_slug}"`,
        `"${row.tenant_name.replace(/"/g, '""')}"`,
        `"${row.plan_code}"`,
        `"${row.country}"`,
        ...cols,
        `"${row.row_total?.display_value ?? "—"}"`,
      ].join(","),
    );
  }
  if (matrix.totals_per_column.length) {
    const totalMap = new Map(
      matrix.totals_per_column.map((t) => [t.core_code, t.display_value]),
    );
    lines.push(
      [
        '"TOTAL"',
        '""',
        '""',
        '""',
        ...coreCodes.map((c) => `"${totalMap.get(c) ?? "—"}"`),
        `"${matrix.grand_total?.display_value ?? "—"}"`,
      ].join(","),
    );
  }
  return "\uFEFF" + lines.join("\n");
}
