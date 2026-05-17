/**
 * EP-9b bank application queue — module-level tuning (RULE 5).
 * JWT storage key mirrors AuthContext STORAGE_KEYS.sicToken for Bearer middleware.
 */
export const QUEUE_POLLING_INTERVAL_SEC = 25;
export const OPTIMISTIC_CLAIM_TIMEOUT_MS = 3000;
export const PTI_GREEN_MAX = 15;
export const PTI_AMBER_MAX = 20;

/** Fallback DTI bands when tenant_thresholds omit explicit caps */
export const DTI_GREEN_MAX = 36;
export const DTI_AMBER_MAX = 43;

export const BANK_ANALYST_ROLE_HEADER = "BANK_ANALYST";
export const BANK_QUEUE_AUTH_TOKEN_STORAGE_KEY = "nadakki_sic_token";

export const BANK_QUEUE_DEFAULT_LIMIT = 50;
export const BANK_QUEUE_VIRTUALIZATION_ROW_CAP = 100;
