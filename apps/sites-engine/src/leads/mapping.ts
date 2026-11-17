// Formulario por intencion de Baylara -> LeadSubmission (additionalProperties:false). El motor compone 'message' con etiquetas.
import { consentsFor, type Consent, type Locale } from './consent';

export interface LeadSubmission {
  name: string; email?: string; phone?: string; message: string; locale: Locale; source_page: string;
  interest?: { kind: 'listing' | 'development' | 'building'; slug: string }; consents: Consent[]; form_rendered_at: string; company_website?: string;
}
export type Mapped = { ok: true; submission: LeadSubmission; locale: Locale } | { ok: false; reason: 'tenant_field' | 'invalid' };

const INTENTS: Record<string, string> = { buyer: 'Comprador', seller: 'Vendedor / propietario (valoración)', tenant: 'Inquilino', consult: 'Consulta agendada', property: 'Interés en una propiedad', alerts: 'Alertas de edificio', market: 'Suscripción al informe de mercado', saved: 'Búsqueda guardada' };
const FIELDS: [string, string][] = [['preferred', 'Contacto preferido'], ['channel', 'Recibir por'], ['date', 'Día solicitado'], ['time', 'Hora'], ['topic', 'Tema'], ['timeline', 'Plazo'], ['payment', 'Forma de pago'], ['country', 'País de residencia'], ['building', 'Edificio'], ['listing', 'Propiedad'], ['development', 'Desarrollo'], ['search', 'Búsqueda'], ['area', 'Zona'], ['budget', 'Presupuesto'], ['address', 'Dirección de la propiedad'], ['propertyType', 'Tipo de propiedad'], ['goal', 'Objetivo'], ['rentBudget', 'Presupuesto mensual'], ['moveIn', 'Fecha de mudanza'], ['bedrooms', 'Habitaciones'], ['message', 'Mensaje']];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// eslint-disable-next-line no-control-regex
const clean = (v: unknown, max = 2000): string => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

/** Honeypot: el del contrato ('company_website') y el de Baylara ('website'). */
export function isHoneypot(f: Record<string, unknown>): boolean {
  return clean(f.company_website, 200) !== '' || clean(f.website, 200) !== '';
}

/** E.164 o undefined (se quitan espacios, guiones y parentesis). */
function e164(raw: string): string | undefined {
  const s = raw.replace(/[\s().-]/g, '');
  return /^\+[1-9][0-9]{6,14}$/.test(s) ? s : undefined;
}

export function buildSubmission(f: Record<string, unknown>, o: { formRenderedAt: string; referer?: string }): Mapped {
  if ('tenant_id' in f) return { ok: false, reason: 'tenant_field' }; // site_id en el cuerpo se DESCARTA (no se lee nunca)
  const locale: Locale = f.lang === 'en' ? 'en' : 'es';
  const intent = typeof f.intent === 'string' && INTENTS[f.intent] ? f.intent : null;
  const fullName = [clean(f.name, 120), clean(f.lastName, 120)].filter(Boolean).join(' ').slice(0, 120);
  const email = clean(f.email, 254);
  const phoneRaw = clean(f.phone, 60);
  const phone = phoneRaw ? e164(phoneRaw) : undefined;
  if (!intent || (!fullName && intent !== 'market') || (!email && !phone)) return { ok: false, reason: 'invalid' };
  if (email && !EMAIL.test(email)) return { ok: false, reason: 'invalid' };

  const rows = [['Intención', INTENTS[intent]], ...FIELDS.map(([k, l]) => [l, clean(f[k])]).filter(([, v]) => v)];
  if (phoneRaw && !phone) rows.push(['Teléfono (sin validar)', phoneRaw]);
  const message = rows.map(([k, v]) => `${k}: ${v}`).join('\n').slice(0, 4000);

  let page = clean(f.page, 300);
  if (!page && o.referer) { try { page = new URL(o.referer).pathname; } catch { /* sin referer valido */ } }
  const slug = (v: unknown): string | null => { const s = clean(v, 96).toLowerCase(); return SLUG.test(s) ? s : null; };
  const dev = slug(f.development), lst = slug(f.listing), bld = slug(f.building);
  const interest = dev ? { kind: 'development' as const, slug: dev } : lst ? { kind: 'listing' as const, slug: lst } : bld ? { kind: 'building' as const, slug: bld } : undefined;

  const submission: LeadSubmission = {
    name: fullName || 'Suscriptor', ...(email ? { email } : {}), ...(phone ? { phone } : {}), message, locale,
    source_page: page || '/', ...(interest ? { interest } : {}), consents: consentsFor(f, locale), form_rendered_at: o.formRenderedAt, company_website: '',
  };
  return { ok: true, submission, locale };
}
