/**
 * Stable Idempotency-Key for the dealer wizard's /multi-lender/execute call.
 *
 * One key per draft: derived from the application id plus a nonce that lives in
 * sessionStorage next to the draft. Every retry of the same draft reuses it until
 * the submission succeeds; `clearSubmitIdempotencyKey` then drops the nonce so the
 * next draft starts clean. Never regenerated per attempt.
 */

const NONCE_PREFIX = "nadakki:dealer-submit-nonce:";
// Fallback when sessionStorage is unavailable, so retries in the same page still agree.
const memoryNonces = new Map<string, string>();

function nonceStorageKey(tenantId: string, applicationId: string): string {
  return `${NONCE_PREFIX}${tenantId}:${applicationId}`;
}

function newNonce(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getSubmitIdempotencyKey(tenantId: string, applicationId: string): string {
  const storageKey = nonceStorageKey(tenantId, applicationId);
  let nonce: string | null = null;
  let storageOk = true;
  try {
    nonce = sessionStorage.getItem(storageKey);
  } catch {
    storageOk = false;
    nonce = memoryNonces.get(storageKey) ?? null;
  }
  if (!nonce) {
    nonce = newNonce();
    if (storageOk) {
      try {
        sessionStorage.setItem(storageKey, nonce);
      } catch {
        storageOk = false;
      }
    }
    if (!storageOk) memoryNonces.set(storageKey, nonce);
  }
  return `dealer-submit:${applicationId}:${nonce}`;
}

export function clearSubmitIdempotencyKey(tenantId: string, applicationId: string): void {
  const storageKey = nonceStorageKey(tenantId, applicationId);
  memoryNonces.delete(storageKey);
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}
