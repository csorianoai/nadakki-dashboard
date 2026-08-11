/** Scoped localStorage keys for dealer wizard drafts (tenant + user isolation). */

export const WIZARD_DRAFT_KEY_PREFIX = "nadakki_dealer_wizard_v1";

/** Legacy global keys — may contain cross-tenant PII; delete without reading. */
export const LEGACY_GLOBAL_WIZARD_DRAFT_KEYS = [
  "nadakki_dealer_wizard_v1",
  "forge-dealer-wizard-draft-v1",
] as const;

export const WIZARD_AUTOSAVE_TOAST_SESSION_KEY = "forge-dealer-wizard-autosave-first-success-v1";

export function buildWizardDraftStorageKey(tenantId: string, userId: string): string {
  return `${WIZARD_DRAFT_KEY_PREFIX}_${tenantId}_${userId}`;
}

/** Remove legacy global draft keys (never parse — may contain PII from another tenant). */
export function purgeLegacyGlobalWizardDraftKeys(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_GLOBAL_WIZARD_DRAFT_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function clearWizardDraftStorage(tenantId?: string | null, userId?: string | null): void {
  purgeLegacyGlobalWizardDraftKeys();
  if (typeof window === "undefined") return;
  if (tenantId && userId) {
    try {
      localStorage.removeItem(buildWizardDraftStorageKey(tenantId, userId));
    } catch {
      /* ignore */
    }
  }
  try {
    sessionStorage.removeItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
