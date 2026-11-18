// Fichas de entidades del core (propiedad, desarrollo, zona, edificio) de Baylara (property.js, pages.js). Solo datos del core:
// nada se lee de content/*.json ni de ui.json. Los rotulos fijos son marco (ES/EN), igual que el shell.
import { createElement as h, type ReactElement } from 'react';
import type { I18nText, Lang, Money, PublicBuilding, PublicDevelopment, PublicListing, PublicMedia, PublicZone } from '@/core/types';
import { BlockError } from '@/blocks/model';
import { Media } from './media';

const LABELS = {
  price: { es: 'Precio', en: 'Price' }, price_from: { es: 'Desde', en: 'From' }, features: { es: 'Características', en: 'Features' },
  amenities: { es: 'Amenidades', en: 'Amenities' }, developer: { es: 'Desarrollador', en: 'Developer' }, delivery: { es: 'Entrega', en: 'Delivery' },
  area: { es: 'Zona', en: 'Area' }, source: { es: 'Fuente', en: 'Source' }, hoa: { es: 'Cuota de administración (HOA)', en: 'HOA' },
  range: { es: 'Rango de precios', en: 'Price range' }, gallery: { es: 'Galería', en: 'Gallery' },
} as const;
const t = (k: keyof typeof LABELS, lang: Lang): string => LABELS[k][lang];
const tx = (v: I18nText | undefined, lang: Lang): string => (v ? (lang === 'en' ? v.en ?? v.es : v.es) : '');

export function money(m: Money | undefined | null, lang: Lang): string {
  if (!m) return '';
  const n = Number(m.amount);
  if (!Number.isFinite(n) || !/^[A-Z]{3}$/.test(m.currency)) throw new BlockError('shape');
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-ES', { style: 'currency', currency: m.currency, maximumFractionDigits: 0 }).format(n);
}

type Row = [string, string | undefined];
const kv = (rows: Row[]): ReactElement | null => {
  const r = rows.filter(([, v]) => v);
  return r.length ? h('dl', { className: 'kv' }, ...r.map(([k, v]) => h('div', { key: k }, h('dt', null, k), h('dd', null, v)))) : null;
};
const ticks = (list: string[]): ReactElement | null => (list.length ? h('ul', { className: 'ticks grid' }, ...list.map((f, i) => h('li', { key: i }, f))) : null);
const section = (title: string, ...kids: (ReactElement | null)[]): ReactElement | null => {
  const k = kids.filter(Boolean);
  return k.length ? h('section', { className: 'ficha-sec' }, h('h2', null, title), ...k) : null;
};
const gallery = (media: PublicMedia[] | undefined, lang: Lang, hosts: string[]): ReactElement | null => {
  const items = (media ?? []).slice(1).map((m) => h('li', { key: m.id }, h(Media, { m, lang, hosts, sizes: '(min-width: 900px) 33vw, 100vw' }))).filter(Boolean);
  return items.length ? h('section', { className: 'ficha-sec gallery', 'aria-label': t('gallery', lang) }, h('ul', { className: 'gallery-grid' }, ...items)) : null;
};
const wrap = (kind: string, ...kids: (ReactElement | null)[]): ReactElement => h('article', { className: 'ficha', 'data-ficha': kind }, ...kids);

export interface FichaCtx { lang: Lang; hosts: string[]; zoneName?: string }

export function listingFicha(d: PublicListing, c: FichaCtx): ReactElement {
  return wrap('listing',
    d.price ? h('p', { className: 'ficha-price' }, money(d.price, c.lang)) : null,
    d.description ? h('div', { className: 'ficha-desc' }, h('p', null, tx(d.description, c.lang))) : null,
    kv([[t('area', c.lang), c.zoneName]]),
    section(t('features', c.lang), ticks(d.features.map((f) => tx(f, c.lang)))),
    gallery(d.media, c.lang, c.hosts));
}

export function developmentFicha(d: PublicDevelopment, c: FichaCtx): ReactElement {
  const price = d.price_from && d.currency ? money({ amount: d.price_from, currency: d.currency }, c.lang) : undefined;
  return wrap('development',
    d.description ? h('div', { className: 'ficha-desc' }, h('p', null, tx(d.description, c.lang))) : null,
    kv([[t('price_from', c.lang), price], [t('developer', c.lang), d.developer], [t('delivery', c.lang), d.delivery_year ? String(d.delivery_year) : undefined],
      [t('area', c.lang), d.area ?? c.zoneName]]),
    section(t('amenities', c.lang), ticks((d.amenities ?? []).map((a) => tx(a, c.lang)))),
    gallery(d.media, c.lang, c.hosts));
}

export function zoneFicha(d: PublicZone, c: FichaCtx): ReactElement {
  const r = d.price_range;
  const range = r && (r.min || r.max) ? [money(r.min, c.lang), money(r.max, c.lang)].filter(Boolean).join(' – ') : undefined;
  return wrap('zone',
    d.lead ? h('p', { className: 'lede' }, tx(d.lead, c.lang)) : null,
    d.body ? h('div', { className: 'ficha-desc' }, h('p', null, tx(d.body, c.lang))) : null,
    kv([[t('range', c.lang), range]]),
    d.source ? h('p', { className: 'small' }, `${t('source', c.lang)}: ${d.source}${d.source_date ? ` (${d.source_date})` : ''}`) : null);
}

export function buildingFicha(d: PublicBuilding, c: FichaCtx): ReactElement {
  const hoa = d.hoa ? Object.entries(d.hoa).filter(([, v]) => typeof v === 'string' || typeof v === 'number').map(([k, v]) => [k, String(v)] as Row) : [];
  return wrap('building',
    d.summary ? h('div', { className: 'ficha-desc' }, h('p', null, tx(d.summary, c.lang))) : null,
    section(t('hoa', c.lang), kv(hoa)),
    d.data_source ? h('p', { className: 'small' }, `${t('source', c.lang)}: ${d.data_source}${d.data_date ? ` (${d.data_date})` : ''}`) : null);
}
