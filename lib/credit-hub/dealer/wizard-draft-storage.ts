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

/**
 * Purge ALL wizard drafts from localStorage, regardless of tenant/user.
 * Use ONLY on logout to ensure no PII survives session end.
 * Violates Ley 172-13 if PII (cédula, nombre, dirección, ingreso) persists post-logout.
 */
export function purgeAllWizardDrafts(): void {
  if (typeof window === "undefined") return;
  purgeLegacyGlobalWizardDraftKeys();
  
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(WIZARD_DRAFT_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    
    sessionStorage.removeItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
