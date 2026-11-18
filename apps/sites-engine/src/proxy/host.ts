// Normalizacion de Host y regla del panel. Autocontenido. Sin consultar a nadie: puro.
import { domainToASCII } from 'node:url';

/** Patron Host de C-SITES-RENDER (schema.json $defs/Host). */
const HOST_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
/** Antes de punycode: solo letras Unicode, digitos, '-', '.', y un puerto numerico opcional. */
const RAW_RE = /^[\p{L}\p{N}.-]+(?::\d{1,5})?$/u;

/** Dominio del panel (decision D5-ter): constante en el codigo, nunca variable de entorno. */
export const PANEL_DOMAIN = 'nadakki.com';

/** Minusculas, sin puerto ni punto final, punycode; null si no cumple el patron Host del contrato. */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 300) return null;
  const s = raw.trim().toLowerCase();
  if (!RAW_RE.test(s)) return null;
  const noPort = s.replace(/:\d{1,5}$/, '').replace(/\.$/, '');
  const ascii = domainToASCII(noPort);
  return ascii && HOST_RE.test(ascii) ? ascii : null;
}

/** nadakki.com y *.nadakki.com (incluido sites.nadakki.com) son del panel: el motor nunca los sirve. */
export function isPanelHost(host: string): boolean {
  return host === PANEL_DOMAIN || host.endsWith(`.${PANEL_DOMAIN}`);
}
