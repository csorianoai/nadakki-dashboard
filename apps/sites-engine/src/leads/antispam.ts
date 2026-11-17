// Antispam del motor: tiempo minimo, cookie firmada de host (sin JS) y comprobacion de origen.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeHost } from '../proxy/host';

export const MIN_FILL_MS = 3_000;
export const MAX_FILL_MS = 24 * 3600_000;
/** Prefijo __Host-: solo Secure, Path=/ y sin Domain; nunca compartida entre hosts. */
export const FORM_COOKIE = '__Host-nk_fr';

export function checkTiming(renderedAtMs: number, nowMs: number): 'ok' | 'too_fast' | 'expired' {
  const d = nowMs - renderedAtMs;
  return d < MIN_FILL_MS ? 'too_fast' : d > MAX_FILL_MS ? 'expired' : 'ok';
}

const mac = (secret: string, siteId: string, ts: number): string =>
  createHmac('sha256', secret).update(`form-cookie.v1.${siteId}.${ts}`).digest('base64url');

/** Valor de la cookie: '<ms>.<firma>' ligado al site_id (con clave derivada de la de sitio por separacion de dominio). */
export function signFormCookie(secret: string, siteId: string, ts: number): string {
  return `${ts}.${mac(secret, siteId, ts)}`;
}

/** Devuelve el instante (ms) o null si falta, esta alterada, es de otro sitio o de otra clave. */
export function verifyFormCookie(secret: string, siteId: string, value: string | undefined | null): number | null {
  const m = /^(\d{10,16})\.([A-Za-z0-9_-]{43})$/.exec(value ?? '');
  if (!m) return null;
  const want = Buffer.from(mac(secret, siteId, Number(m[1])));
  const got = Buffer.from(m[2]);
  return want.length === got.length && timingSafeEqual(want, got) ? Number(m[1]) : null;
}

/** Same-origin: Origin (si viene) debe ser el host de la peticion; Sec-Fetch-Site distinto de same-origin/none se rechaza. */
export function checkOrigin(h: Headers): boolean {
  const sfs = h.get('sec-fetch-site');
  if (sfs && sfs !== 'same-origin' && sfs !== 'none') return false;
  const origin = h.get('origin');
  if (origin === null) return true;
  try {
    const oh = normalizeHost(new URL(origin).host);
    return oh !== null && oh === normalizeHost(h.get('host'));
  } catch { return false; }
}
