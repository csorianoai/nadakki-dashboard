/** Tenant UUID for nadakki-demo (see docs/runbooks/SPRINT_3_PROVISIONING_DEMO_ADMIN.md). */
export const NADAKKI_DEMO_TENANT_ID = "d3b00111-0000-0000-0000-000000d3b001";

export function isNadakkiDemoTenant(tenantId: string | null | undefined): boolean {
  return tenantId === NADAKKI_DEMO_TENANT_ID;
}
