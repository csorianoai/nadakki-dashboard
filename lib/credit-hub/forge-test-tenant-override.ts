import { TESTBANK_MEXICO_FIXTURE, FORGE_TEST_MX_TENANT_ID } from "@/app/(forge)/credit-hub/_design/_inventory/test-tenant-fixtures";
import type { TenantBankingConfig } from "@/lib/credit-hub/types/tenantConfig";

export { FORGE_TEST_MX_TENANT_ID } from "@/app/(forge)/credit-hub/_design/_inventory/test-tenant-fixtures";

/** Build-time flag: swap Credit Hub tenant config + `.forge-app` theme for reusability test. */
export function isForgeMxTestTenantBuild(): boolean {
  return process.env.NEXT_PUBLIC_FORGE_TEST_TENANT === "mx";
}

/** Sets `[data-tenant]` on `.forge-app` so `styles/forge-tokens-v2.css` tenant ramp applies. */
export function forgeAppDataTenantAttribute(): string | undefined {
  return isForgeMxTestTenantBuild() ? FORGE_TEST_MX_TENANT_ID : undefined;
}

export function getForgeTestTenantBankingConfig(): TenantBankingConfig | null {
  return isForgeMxTestTenantBuild() ? TESTBANK_MEXICO_FIXTURE : null;
}
