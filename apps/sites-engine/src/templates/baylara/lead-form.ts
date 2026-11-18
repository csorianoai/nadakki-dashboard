// Formulario de contacto de Baylara portado a TypeScript (sin cliente React): POST nativo a /api/lead (ST2-05).
// HTML de servidor puro (la CSP del motor es script-src 'self' sin inline): el boton va siempre habilitado y el tiempo
// minimo de relleno lo garantiza handleLead con la cookie firmada de host. form_rendered_at queda vacio en el HTML.
// Nunca se emite Idempotency-Key (la pone el motor en el servidor).
import { createElement as h, type ReactElement } from 'react';
import type { I18nText, Lang } from '@/core/types';
import { TEXT_VERSIONS } from '@/leads/consent';

export interface LeadField { name: string; label: I18nText; type?: 'text' | 'email' | 'tel' | 'date' | 'month' | 'textarea' | 'select'; options?: string[]; full?: boolean }
export interface LeadFormData {
  intent: string; fields: LeadField[]; submit: I18nText; note?: I18nText; consent_phone?: I18nText; consent_email?: I18nText;
  privacy_href?: string; privacy_label?: I18nText; interest?: { kind: 'listing' | 'development' | 'building'; slug: string };
}

const tx = (t: I18nText | undefined, lang: Lang): string => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

function field(f: LeadField, id: string, lang: Lang): ReactElement {
  const fid = `${id}-${f.name}`;
  const common = { id: fid, name: f.name, className: 'input' };
  const control = f.type === 'textarea' ? h('textarea', { ...common, rows: 4, className: 'input textarea' })
    : f.type === 'select' ? h('select', common, ...(f.options ?? []).map((o) => h('option', { key: o }, o)))
    : h('input', { ...common, type: f.type ?? 'text' });
  return h('div', { key: f.name, className: `f${f.full ? ' full' : ''}` }, h('label', { htmlFor: fid }, tx(f.label, lang)), control);
}


export function LeadForm(p: { data: LeadFormData; lang: Lang; privacyHref?: string; id?: string }): ReactElement {
  const { data: d, lang } = p;
  const id = p.id ?? 'lf';
  const consent = (name: string, text: I18nText, channel: keyof typeof TEXT_VERSIONS, extra: Record<string, string> = {}) => h('div', { className: 'consent', 'data-text-version': TEXT_VERSIONS[channel], ...extra },
    h('input', { id: `${id}-${name}`, name, type: 'checkbox' }),
    h('label', { htmlFor: `${id}-${name}` }, tx(text, lang), ' ', p.privacyHref ? h('a', { href: p.privacyHref }, tx(d.privacy_label, lang)) : null));
  const label = tx(d.submit, lang);
  return h('form', { className: 'form', method: 'post', action: '/api/lead', noValidate: true, 'data-lead': '' },
    h('input', { type: 'hidden', name: 'intent', value: d.intent }),
    h('input', { type: 'hidden', name: 'lang', value: lang }),
    h('input', { type: 'hidden', name: 'form_rendered_at', value: '' }),
    d.interest ? h('input', { type: 'hidden', name: d.interest.kind, value: d.interest.slug }) : null,
    h('div', { className: 'fields' }, ...d.fields.map((f) => field(f, id, lang))),
    h('div', { className: 'hp', 'aria-hidden': 'true' }, h('label', { htmlFor: `${id}-company_website` }, 'Website'),
      h('input', { id: `${id}-company_website`, name: 'company_website', tabIndex: -1, autoComplete: 'off' })),
    d.consent_email ? consent('consent_email', d.consent_email, 'email') : null,
    d.consent_phone ? consent('consent', d.consent_phone, 'phone_sms', { 'data-text-version-whatsapp': TEXT_VERSIONS.whatsapp }) : null,
    h('div', { className: 'btn-row' }, h('button', { type: 'submit', className: 'btn btn-primary' }, label)),
    d.note ? h('p', { className: 'small' }, tx(d.note, lang)) : null);
}
