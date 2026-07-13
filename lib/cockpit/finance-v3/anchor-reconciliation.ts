/** Cross-phase MRR anchor reconciliation — F7 gate (margin 0). */

export type AnchorSources = {
  kpis_total_mrr: number;
  mrr_by_core_sum: number;
  mrr_by_core_attributable?: boolean;
  matrix_unique_tenant_mrr: number;
  matrix_total_rows?: number;
  overview_tenant_mrr_sum: number;
  overview_tenant_count?: number;
  db_mrr_all_sum: number;
};

export type AnchorMismatch = {
  code: string;
  severity: string;
  source: string;
  expected: number;
  actual: number;
  delta: number;
};

export type AnchorReconciliationResult = {
  ok: boolean;
  priority: "P0" | null;
  epsilon: number;
  sources: AnchorSources;
  mismatches: AnchorMismatch[];
  as_of?: string;
  notes?: string[];
};

const ANCHOR_KEYS: (keyof Pick<
  AnchorSources,
  "kpis_total_mrr" | "matrix_unique_tenant_mrr" | "overview_tenant_mrr_sum" | "db_mrr_all_sum"
>)[] = [
  "kpis_total_mrr",
  "matrix_unique_tenant_mrr",
  "overview_tenant_mrr_sum",
  "db_mrr_all_sum",
];

/** Validate anchor response — unique-tenant sums must match exactly (epsilon 0). */
export function validateAnchorReconciliation(
  result: AnchorReconciliationResult,
): { ok: boolean; mismatches: AnchorMismatch[] } {
  const reference = result.sources.kpis_total_mrr;
  const epsilon = result.epsilon ?? 0;
  const mismatches: AnchorMismatch[] = [];

  for (const key of ANCHOR_KEYS) {
    const actual = result.sources[key];
    if (Math.abs(actual - reference) > epsilon) {
      mismatches.push({
        code: "ANCHOR_MISMATCH",
        severity: "error",
        source: key,
        expected: reference,
        actual,
        delta: actual - reference,
      });
    }
  }

  const serverOk = result.ok && result.mismatches.length === 0;
  const clientOk = mismatches.length === 0;
  return {
    ok: serverOk && clientOk,
    mismatches: [...result.mismatches, ...mismatches],
  };
}

/** Format anchor report for RECONCILIATION_REPORT.md */
export function formatAnchorReport(result: AnchorReconciliationResult): string {
  const lines = [
    `# Anchor Reconciliation Report`,
    ``,
    `**As of:** ${result.as_of ?? new Date().toISOString()}`,
    `**Status:** ${result.ok ? "GREEN" : "RED — P0"}`,
    `**Epsilon:** ${result.epsilon}`,
    ``,
    `## Sources`,
    ``,
    `| Source | Value |`,
    `|--------|-------|`,
    `| KPIs total_mrr | ${result.sources.kpis_total_mrr} |`,
    `| MRR by-core sum (attributable) | ${result.sources.mrr_by_core_sum} |`,
    `| Matrix unique tenant MRR | ${result.sources.matrix_unique_tenant_mrr} |`,
    `| Overview tenant MRR sum (${result.sources.overview_tenant_count ?? "?"} tenants) | ${result.sources.overview_tenant_mrr_sum} |`,
    `| DB SUM(mrr_calculated) | ${result.sources.db_mrr_all_sum} |`,
    ``,
  ];

  if (result.mismatches.length) {
    lines.push(`## Mismatches (P0)`, ``);
    for (const m of result.mismatches) {
      lines.push(`- **${m.source}**: expected ${m.expected}, got ${m.actual} (Δ ${m.delta})`);
    }
    lines.push(``);
  }

  if (result.notes?.length) {
    lines.push(`## Notes`, ``);
    for (const n of result.notes) lines.push(`- ${n}`);
  }

  return lines.join("\n");
}
