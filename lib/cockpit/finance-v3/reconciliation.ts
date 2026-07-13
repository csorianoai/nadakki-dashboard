/**
 * ARR = MRR × 12. MRR core rows are attributable (may sum above tenant total).
 * See docs/cockpit/finance-v3/DATA_RECONCILIATION.md
 */
export function projectArr(totalMrr: number): number {
  return totalMrr * 12;
}

export function sumMrrByCore(cores: { mrr: number }[]): number {
  return cores.reduce((acc, c) => acc + c.mrr, 0);
}

export function sumTenantMrr(rows: { mrr_contribution: number }[]): number {
  return rows.reduce((acc, r) => acc + r.mrr_contribution, 0);
}

export interface ReconciliationResult {
  ok: boolean;
  globalMrr: number;
  tenantSum: number;
  coreSum: number;
  arr: number;
  deltaTenant: number;
  deltaCore: number;
  warnings: string[];
}

/** Validates MRR totals; core sum may exceed global (attributable double-count). */
export function reconcileMrr(
  globalMrr: number,
  tenantRows: { mrr_contribution: number }[],
  coreRows: { mrr: number }[],
): ReconciliationResult {
  const tenantSum = sumTenantMrr(tenantRows);
  const coreSum = sumMrrByCore(coreRows);
  const arr = projectArr(globalMrr);
  const deltaTenant = Math.abs(globalMrr - tenantSum);
  const deltaCore = Math.abs(globalMrr - coreSum);
  const warnings: string[] = [];
  if (deltaTenant > 0.01) {
    warnings.push(`MRR global (${globalMrr}) ≠ suma tenants (${tenantSum})`);
  }
  if (coreSum > globalMrr + 0.01) {
    warnings.push(
      `MRR por core (${coreSum}) > MRR global — atribución multi-core esperada`,
    );
  }
  return {
    ok: deltaTenant <= 0.01,
    globalMrr,
    tenantSum,
    coreSum,
    arr,
    deltaTenant,
    deltaCore,
    warnings,
  };
}
