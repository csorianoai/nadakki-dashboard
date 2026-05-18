import { Buffer } from "buffer";

/** Same shape as tests/bank-application-detail/test-token.ts for Playwright runtime. */
export function makeBankE2eJwt(tid: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ tid })).toString("base64url");
  return `${header}.${payload}.e2e`;
}

export const BANK_E2E_TOKEN_KEY = "nadakki_sic_token";

export function sampleDetailBody(applicationId: string) {
  return {
    application_id: applicationId,
    queue_status: "pending",
    borrower_name_masked: "F. *** Last",
    amount: 75000,
    currency: "DOP",
    dealer: { id: "dealer-1", name: "Forge Dealer", location: "Santo Domingo" },
    borrower: {
      dob_year: 1985,
      cedula_masked: "XXX-XXXXXXX-X",
      income_monthly: 75000,
      employment: { employer: "ACME", position: "Analyst", tenure_months: 24 },
    },
    vehicle: { year: 2022, make: "Toyota", model: "Corolla", vin: "VINHASH", dealer_location: "SDE" },
    scoring: {
      pti: 12.5,
      dti: 31.2,
      internal_score: 720,
      bureau_score: 685,
      tenant_thresholds: { pti_green_max: 15, pti_amber_max: 20, dti_green_max: 36, dti_amber_max: 43 },
    },
    prior_decisions: [],
    documents: [{ id: "d1", name: "Cédula", status: "present" }],
    stipulations: [],
    events_count: 2,
    recent_events: [{ at: "2025-06-01T10:00:00.000Z", type: "INGEST", summary: "Solicitud recibida" }],
    bank_claim: { claimed_by: null, claimed_at: null, current_user_owns: false },
    notes: "",
    last_process_result: null,
    hours_until_sla: 3.5,
  };
}

/** Detail with claim ready for decision modal (EP-11 e2e). */
export function sampleDetailOwnedClaim(applicationId: string) {
  const base = sampleDetailBody(applicationId);
  return {
    ...base,
    bank_claim: {
      analyst_id: "11111111-1111-4111-8111-111111111111",
      claimed_by: "11111111-1111-4111-8111-111111111111",
      claimed_at: new Date().toISOString(),
      current_user_owns: true,
    },
  };
}
