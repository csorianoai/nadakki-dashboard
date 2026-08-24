/**
 * Session storage cleanup utilities for logout (Ley 172-13).
 * 
 * CRITICAL: sessionStorage can contain PII from credit applications, stipulations,
 * audit trails, and simulation scenarios. In shared devices (e.g., dealer offices),
 * this data must not survive logout.
 * 
 * This module provides a centralized cleanup function that removes ALL sessionStorage
 * keys that may contain PII. Pattern-based removal ensures new PII-bearing keys are
 * caught even if not explicitly registered here.
 */

/**
 * Known PII-bearing key prefixes in sessionStorage.
 * 
 * Add new prefixes here when introducing sessionStorage keys that may contain:
 * - Applicant personal data (name, cédula, date of birth, phone, email, address)
 * - Financial data (income, debts, credit scores)
 * - Application IDs or other identifiers that can link to PII
 */
const PII_PREFIXES = [
  'nadakki_credit_',           // Credit process results (app/hooks/useCredit.ts)
  'nadakki:stip-workflow',     // Stipulation workflows (lib/bank/stipulations/workflow-storage.ts)
  'nadakki:audit:bank-stip',   // Workflow audit trail (lib/bank/stipulations/workflow-audit.ts)
  'nadakki-credit-hub-scenarios', // Saved scenarios (lib/credit-hub/hooks/useScenarioStore.ts)
  'nadakki-wizard-telemetry:', // Wizard telemetry (hooks/useCompressedWizard.ts)
] as const;

/**
 * Clear PII from sessionStorage on logout (Ley 172-13).
 * 
 * Removes all sessionStorage keys that match known PII-bearing prefixes.
 * This ensures compliance with Dominican data protection law (Ley 172-13)
 * which requires PII not to persist after session ends in shared devices.
 * 
 * Called automatically by logout in lib/auth/auth-context.tsx.
 * 
 * @example
 * ```ts
 * // In logout flow
 * clearSessionStorage();
 * ```
 */
export function clearSessionStorage(): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  
  try {
    // Iterate through all sessionStorage keys and remove PII-bearing ones
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      for (const prefix of PII_PREFIXES) {
        if (key.startsWith(prefix)) {
          sessionStorage.removeItem(key);
          break;
        }
      }
    }
  } catch {
    // Private mode / quota exceeded - ignore
  }
}

/**
 * Check if sessionStorage contains any PII-bearing keys.
 * 
 * Used for testing and auditing. Returns true if any keys match PII prefixes.
 * 
 * @returns true if PII-bearing keys exist, false otherwise
 * 
 * @example
 * ```ts
 * if (hasSessionStoragePII()) {
 *   console.warn("PII found in sessionStorage after logout");
 * }
 * ```
 */
export function hasSessionStoragePII(): boolean {
  if (typeof window === "undefined" || !window.sessionStorage) return false;
  
  try {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      for (const prefix of PII_PREFIXES) {
        if (key.startsWith(prefix)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get all PII-bearing keys currently in sessionStorage.
 * 
 * Used for debugging and auditing. Returns array of matching keys.
 * 
 * @returns Array of key names that match PII prefixes
 */
export function getSessionStoragePIIKeys(): string[] {
  if (typeof window === "undefined" || !window.sessionStorage) return [];
  
  try {
    const piiKeys: string[] = [];
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      for (const prefix of PII_PREFIXES) {
        if (key.startsWith(prefix)) {
          piiKeys.push(key);
          break;
        }
      }
    }
    return piiKeys;
  } catch {
    return [];
  }
}
