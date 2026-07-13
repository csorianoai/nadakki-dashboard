/** FC1 cohabitation — default ON in dev/preview; set NEXT_PUBLIC_COCKPIT_CONSOLIDATION_ENABLED=false to rollback. */
export const COCKPIT_CONSOLIDATION_FLAGS = {
  COCKPIT_CONSOLIDATION_ENABLED:
    process.env.NEXT_PUBLIC_COCKPIT_CONSOLIDATION_ENABLED !== "false",
} as const;

/** Safe defaults — finance routes hidden until explicitly enabled. */
export const COCKPIT_FINANCE_FLAGS = {
  COCKPIT_FINANCE_ENABLED:
    process.env.NEXT_PUBLIC_COCKPIT_FINANCE_ENABLED !== "false",
  COCKPIT_FINANCE_REGISTRY_ENABLED:
    process.env.NEXT_PUBLIC_COCKPIT_FINANCE_REGISTRY_ENABLED !== "false",
  COCKPIT_FINANCE_MATRIX_ENABLED:
    process.env.NEXT_PUBLIC_COCKPIT_FINANCE_MATRIX_ENABLED === "true",
  COCKPIT_FINANCE_TENANT_DETAIL_ENABLED:
    process.env.NEXT_PUBLIC_COCKPIT_FINANCE_TENANT_DETAIL_ENABLED === "true",
} as const;
