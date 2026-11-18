// Bloques legales: los inyecta el RENDERIZADOR (no la plantilla). Falla cerrado: bloque desconocido o legal incompleto -> LegalError.
import { createElement as h, Fragment, type ReactElement, type ReactNode } from 'react';
import type { Lang, Manifest } from '@/core/types';
import { pathFor } from './site';

export class LegalError extends Error {
  constructor() { super('legal'); this.name = 'LegalError'; } // mensaje fijo, sin datos
}
export const KNOWN_BLOCKS = ['legal_brokerage', 'legal_eho', 'legal_privacy', 'legal_license'] as const;
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function checkLegal(m: Manifest): void {
  const l = m.legal as Partial<Manifest['legal']> | undefined;
  if (!Array.isArray(m.required_blocks) || m.required_blocks.some((b) => !(KNOWN_BLOCKS as readonly string[]).includes(b))) throw new LegalError();
  if (!l || !nonEmpty(l.brokerage_legal_name) || !nonEmpty(l.agent_registered_last_name) || !nonEmpty(l.license_no)) throw new LegalError();
  if (!m.routes.some((r) => r.kind === 'page' && r.key === 'privacy')) throw new LegalError(); // legal_privacy necesita destino
}

const TXT = {
  es: { eho: 'Equal Housing Opportunity. Este sitio cumple la ley federal de vivienda justa (Fair Housing Act).', brokerage: 'Correduría', agent: 'Agente licenciado', license: 'Licencia', privacy: 'Privacidad', contact: 'Contacto', via: 'a través de' },
  en: { eho: 'Equal Housing Opportunity. This site complies with the federal Fair Housing Act.', brokerage: 'Brokerage', agent: 'Licensed agent', license: 'License', privacy: 'Privacy', contact: 'Contact', via: 'via' },
} as const;

const digits = (p: string) => p.replace(/\D/g, '');

/** Devuelve la plantilla + el bloque legal (siempre todos los conocidos, aunque required_blocks sea menor). */
export function withLegal(m: Manifest, lang: Lang, body: ReactNode): ReactElement {
  checkLegal(m);
  const t = TXT[lang];
  const broker = m.legal.dba ? `${m.legal.brokerage_legal_name} (${m.legal.dba})` : m.legal.brokerage_legal_name;
  const via = (k: string) => h('span', { className: 'via', 'data-broker': k }, `${t.via} ${broker}`);
  const c = m.contact;
  const items: ReactElement[] = [];
  if (c.whatsapp) items.push(h('li', { key: 'wa' }, h('a', { href: `https://wa.me/${digits(c.whatsapp)}` }, `WhatsApp ${c.whatsapp}`), via('whatsapp')));
  if (c.phone) items.push(h('li', { key: 'tel' }, h('a', { href: `tel:${c.phone}` }, c.phone), via('phone')));
  if (c.email) items.push(h('li', { key: 'mail' }, h('a', { href: `mailto:${c.email}` }, c.email), via('email')));
  const privacy = m.routes.find((r) => r.kind === 'page' && r.key === 'privacy')!;
  const legal = h('aside', { 'data-legal': '', lang, className: 'legal-block' },
    h('ul', { className: 'legal-contacts', 'aria-label': t.contact }, ...items),
    h('p', { className: 'stickybar-broker', 'data-broker-sticky': '' }, broker), // barra fija movil: correduria sobre WhatsApp/Llamar
    h('p', { 'data-broker': 'brokerage' }, h('strong', null, `${t.brokerage}: `), broker, ` · ${t.license} ${m.legal.license_no}`),
    h('p', null, h('strong', null, `${t.agent}: `), m.legal.agent_registered_last_name, m.legal.team_name_approved ? ` · ${m.legal.team_name_approved}` : ''),
    h('p', { className: 'eho' }, h('svg', { role: 'img', 'aria-label': 'Equal Housing Opportunity', width: 52, height: 52, viewBox: '0 0 44 44', fill: 'none' },
      h('path', { d: 'M4 21 L22 5 L40 21 V39 H4 Z', stroke: 'currentColor', strokeWidth: 2.6, strokeLinejoin: 'round' }),
      h('rect', { x: 13, y: 20, width: 18, height: 4.2, fill: 'currentColor' }), h('rect', { x: 13, y: 28, width: 18, height: 4.2, fill: 'currentColor' })), ' ', t.eho),
    h('a', { href: pathFor(m, lang, privacy) }, t.privacy));
  return h(Fragment, null, body, legal);
}
