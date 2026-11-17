// POST publico a C-SITES-LEADS con reintentos dentro de la peticion: max 3 intentos, backoff 200/800 ms, tope total 8 s.
// Solo red/408/429/5xx se reintentan, siempre con la MISMA Idempotency-Key. 4xx -> rejected (sin reintento). Sin PII en logs.
import type { LeadSubmission } from './mapping';
import { siteKey } from './sitekey';

export type SendResult = { kind: 'accepted' } | { kind: 'rejected'; status: number } | { kind: 'unavailable' };
export interface SendOptions {
  fetch: typeof globalThis.fetch; baseUrl: string; siteId: string; secret: string; key: string; submission: LeadSubmission;
  sleep?: (ms: number) => Promise<void>; now?: () => number; attemptTimeoutMs?: number;
}
const BACKOFF = [200, 800];
const BUDGET_MS = 8_000;
const MAX_ATTEMPTS = 3;

export async function sendLead(o: SendOptions): Promise<SendResult> {
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = o.now ?? Date.now;
  const start = now();
  const url = `${o.baseUrl.replace(/\/$/, '')}/public/${o.siteId}/leads`;
  const headers = { 'content-type': 'application/json', 'x-site-key': siteKey(o.secret, o.siteId), 'idempotency-key': o.key };
  const body = JSON.stringify(o.submission);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let wait = BACKOFF[attempt] ?? 0;
    try {
      const res = await o.fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(o.attemptTimeoutMs ?? 3_000) });
      if (res.status === 202) return { kind: 'accepted' };
      const retryable = res.status === 408 || res.status === 429 || res.status >= 500;
      if (!retryable) return { kind: 'rejected', status: res.status };
      const ra = Number(res.headers.get('retry-after'));
      if (res.status === 429 && Number.isFinite(ra) && ra > 0) wait = ra * 1000;
    } catch { /* red: se reintenta */ }
    if (attempt === MAX_ATTEMPTS - 1 || now() - start + wait > BUDGET_MS) break;
    await sleep(wait);
  }
  return { kind: 'unavailable' };
}
