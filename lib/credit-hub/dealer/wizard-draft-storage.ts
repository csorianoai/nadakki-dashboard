/**
 * Dealer wizard drafts live on the server (DB-CODEX-12B). The browser keeps only a pointer
 * (tenant id + application id, no personal data) in sessionStorage; form data is never written to storage.
 */

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

export const WIZARD_DRAFT_POINTER_SUFFIX = ":application-id";

export interface WizardDraftPointer {
  tenantId: string;
  applicationId: string;
}

export function buildWizardDraftPointerKey(tenantId: string, userId: string): string {
  return `${buildWizardDraftStorageKey(tenantId, userId)}${WIZARD_DRAFT_POINTER_SUFFIX}`;
}

export function writeWizardDraftPointer(key: string, pointer: WizardDraftPointer): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(pointer));
  } catch {
    /* the URL remains the source of truth for the current tab */
  }
}

function parseWizardDraftPointer(raw: string | null): WizardDraftPointer | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<WizardDraftPointer> | null;
    if (parsed && typeof parsed.tenantId === "string" && typeof parsed.applicationId === "string" && parsed.applicationId) {
      return { tenantId: parsed.tenantId, applicationId: parsed.applicationId };
    }
  } catch {
    /* pointer from an older build: ignore */
  }
  return null;
}

export function readWizardDraftPointer(key: string): WizardDraftPointer | null {
  try {
    return parseWizardDraftPointer(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

export function clearWizardDraftPointer(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Every pointer left in this tab's sessionStorage (used by logout to delete the server drafts). */
export function listWizardDraftPointers(): WizardDraftPointer[] {
  if (typeof window === "undefined") return [];
  const found: WizardDraftPointer[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(WIZARD_DRAFT_KEY_PREFIX) || !key.endsWith(WIZARD_DRAFT_POINTER_SUFFIX)) continue;
      const pointer = parseWizardDraftPointer(sessionStorage.getItem(key));
      if (pointer) found.push(pointer);
    }
  } catch {
    /* ignore */
  }
  return found;
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
      sessionStorage.removeItem(buildWizardDraftPointerKey(tenantId, userId));
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

    // Punteros de borrador (sessionStorage): solo ids, pero no deben sobrevivir al logout.
    const pointerKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(WIZARD_DRAFT_KEY_PREFIX)) pointerKeys.push(key);
    }
    for (const key of pointerKeys) sessionStorage.removeItem(key);
    
    sessionStorage.removeItem(WIZARD_AUTOSAVE_TOAST_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
