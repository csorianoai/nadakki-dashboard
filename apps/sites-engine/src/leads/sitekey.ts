// X-Site-Key de C-SITES-LEADS: 'v1.' + site_id + '.' + base64url(HMAC-SHA256(clave, 'v1.' + site_id)).
// La clave llega por env (SITES_SITE_KEY_SECRET) y nunca se imprime ni aparece en errores.
import { createHmac } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function siteKey(secret: string, siteId: string): string {
  if (!secret) throw new Error('lead: falta la clave de firma de sitio');
  if (!UUID.test(siteId)) throw new Error('lead: site_id invalido');
  const sig = createHmac('sha256', secret).update(`v1.${siteId}`).digest('base64url');
  return `v1.${siteId}.${sig}`;
}
