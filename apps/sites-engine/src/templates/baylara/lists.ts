// Listados de entidades (ListingsBrowser / BuildingDirectory de Baylara) como tarjetas estaticas. Datos pre-leidos del core;
// solo se pintan las entidades con ruta en el manifiesto (el enlace sale de ahi, nunca de un slug suelto). Filtros/ordenacion
// de Baylara requieren JS de cliente: pendiente de otra PARTE.
import { createElement as h, type ReactElement } from 'react';
import Link from 'next/link';
import type { I18nText, Lang, Manifest, PublicBuilding, PublicDevelopment, PublicListing, PublicMedia, PublicZone } from '@/core/types';
import { BlockError } from '@/blocks/model';
import { pathFor } from '@/render/site';
import { money } from './entities';
import { Media } from './media';

const KIND = { listings: 'listing', developments: 'development', zones: 'zone', buildings: 'building' } as const;
type Source = keyof typeof KIND;
const tx = (t: I18nText | undefined, lang: Lang): string => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

interface Card { slug: string; title: string; sub?: string; photo?: PublicMedia }

function card(source: Source, item: unknown, lang: Lang): Card {
  if (!item || typeof item !== 'object') throw new BlockError('shape');
  switch (source) {
    case 'listings': { const l = item as PublicListing; return { slug: l.slug, title: tx(l.title, lang), sub: money(l.price, lang), photo: l.media?.[0] }; }
    case 'developments': {
      const d = item as PublicDevelopment;
      return { slug: d.slug, title: d.name, sub: d.price_from && d.currency ? money({ amount: d.price_from, currency: d.currency }, lang) : undefined, photo: d.media?.[0] };
    }
    case 'zones': { const z = item as PublicZone; return { slug: z.slug, title: tx(z.name, lang), photo: z.photo ?? undefined }; }
    default: { const b = item as PublicBuilding; return { slug: b.slug, title: b.name }; }
  }
}

export interface ListCtx { manifest: Manifest; lang: Lang; hosts: string[]; list?: { source: string; items: unknown[] } }

export function entityList(d: { source: Source; title?: I18nText }, c: ListCtx): ReactElement {
  if (!c.list || c.list.source !== d.source) throw new BlockError('shape'); // la lista no llego: no se pinta a medias
  const cards = c.list.items.map((it) => {
    const k = card(d.source, it, c.lang);
    const route = c.manifest.routes.find((r) => r.kind === KIND[d.source] && r.key === k.slug);
    if (!route) return null;
    return h('li', { key: k.slug, className: 'card' },
      k.photo ? h(Media, { m: k.photo, lang: c.lang, hosts: c.hosts, sizes: '(min-width: 900px) 33vw, 100vw' }) : null,
      h(Link, { href: pathFor(c.manifest, c.lang, route), className: 'card-title' }, k.title),
      k.sub ? h('p', { className: 'card-sub' }, k.sub) : null);
  }).filter(Boolean);
  return h('section', { className: 'listing-grid', 'data-list': d.source },
    d.title ? h('h2', null, tx(d.title, c.lang)) : null,
    cards.length ? h('ul', { className: 'grid' }, ...cards) : null);
}
