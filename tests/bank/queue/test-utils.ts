import type { BankQueueApplication, BankQueueTenantThresholds } from "@/lib/bank-queue/types";

export const TEST_TID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

/** Unsigned JWT-shaped token for tests (matches dashboard middleware ``tid`` claim). */
export function makeJwt(tid: string = TEST_TID): string {
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ tid })}.sig`;
}

export function seedBankQueueAuth(token: string): void {
  window.localStorage.setItem("nadakki_sic_token", token);
}

export function mockTenantThresholds(
  overrides: Partial<BankQueueTenantThresholds> = {},
): BankQueueTenantThresholds {
  return {
    pti_green_max: 15,
    pti_amber_max: 20,
    pti_red_min: 21,
    dti_green_max: 36,
    dti_amber_max: 43,
    dti_red_min: 44,
    ...overrides,
  };
}

export function mockApplication(overrides: Partial<BankQueueApplication> = {}): BankQueueApplication {
  return {
    application_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    dealer_name: "Demo Dealer",
    borrower_name: "María Q.",
    amount: 450000,
    created_at: "2026-05-01T12:00:00.000Z",
    sla_deadline: "2026-05-02T12:00:00.000Z",
    hours_until_sla: 18,
    status: "pending",
    claimed_by: null,
    claimed_at: null,
    pti: 14,
    dti: 34,
    ...overrides,
  };
}

export function mockQueueResponse(apps: BankQueueApplication[]) {
  return {
    applications: apps,
    total_count: apps.length,
    tenant_thresholds: mockTenantThresholds(),
  };
}
