// Emision de la cookie firmada de tiempo de relleno (sin JS). Solo en navegaciones GET de HTML y si no hay una vigente.
import { FORM_COOKIE, MAX_FILL_MS, signFormCookie, verifyFormCookie } from './antispam';

const SITE_PATH = /^\/s\/([0-9a-f-]{36})(\/|$)/;

export function formCookieFor(o: { method: string; headers: Headers; pathname: string; secret: string | undefined; now: number }): string | null {
  if (!o.secret || o.method !== 'GET' || !(o.headers.get('accept') ?? '').includes('text/html')) return null;
  const siteId = SITE_PATH.exec(o.pathname)?.[1];
  if (!siteId) return null;
  const m = new RegExp(`(?:^|;\\s*)${FORM_COOKIE}=([^;]*)`).exec(o.headers.get('cookie') ?? '');
  const prev = verifyFormCookie(o.secret, siteId, m?.[1]);
  if (prev !== null && o.now - prev < MAX_FILL_MS / 2) return null; // vigente: no degradar la cache de mas
  // __Host-: Secure, Path=/, sin Domain. HttpOnly: el JS no la necesita (con JS el navegador fija form_rendered_at).
  return `${FORM_COOKIE}=${signFormCookie(o.secret, siteId, o.now)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${MAX_FILL_MS / 1000}`;
}
