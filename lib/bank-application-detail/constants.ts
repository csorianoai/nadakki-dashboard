/**
 * EP-10b application detail — module tuning (hard rules v2.0 RULE 5).
 * Auth storage key matches dashboard login (`nadakki_sic_token`).
 */
export const BANK_APPLICATION_AUTH_TOKEN_KEY = "nadakki_sic_token";
export const BANK_ANALYST_ROLE_HEADER = "BANK_ANALYST";

/** Hours below which SLA banner uses destructive emphasis */
export const SLA_RED_HOURS = 2;

/** Aligns with EP-9b queue optimistic claim pattern */
export const OPTIMISTIC_CLAIM_TIMEOUT_MS = 3000;

/** Fallback PTI/DTI bands if scoring.tenant_thresholds missing */
export const PTI_GREEN_MAX = 15;
export const PTI_AMBER_MAX = 20;
export const DTI_GREEN_MAX = 36;
export const DTI_AMBER_MAX = 43;
