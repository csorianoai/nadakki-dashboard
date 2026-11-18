// Bloques de contenido de las paginas de Baylara (Head/Steps/Datum de pages.js): seccion de texto, pasos numerados y cifras con fuente.
// Solo HTML estatico; los textos salen del bloque (es obligatorio, en con respaldo a es).
import { createElement as h, type ReactElement } from 'react';
import type { I18nText, Lang } from '@/core/types';

const tx = (t: I18nText | undefined, lang: Lang): string => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

export function section(d: { eyebrow?: I18nText; title: I18nText; paragraphs?: I18nText[] }, lang: Lang): ReactElement {
  return h('section', { className: 'section' }, h('div', { className: 'container stack' },
    d.eyebrow ? h('p', { className: 'eyebrow' }, tx(d.eyebrow, lang)) : null,
    h('h2', { className: 'h2' }, tx(d.title, lang)),
    ...(d.paragraphs ?? []).map((p, i) => h('p', { key: i }, tx(p, lang)))));
}

export function steps(d: { items: { title: I18nText; body: I18nText }[] }, lang: Lang): ReactElement {
  return h('ol', { className: 'boxed' }, ...d.items.map((s, i) => h('li', { key: i },
    h('span', { className: 'num' }, String(i + 1).padStart(2, '0')),
    h('h3', null, tx(s.title, lang)),
    h('p', null, tx(s.body, lang)))));
}

export function stats(d: { items: { value: string; label: I18nText; source?: string; date?: string }[] }, lang: Lang): ReactElement {
  return h('dl', { className: 'stats' }, ...d.items.map((s, i) => h('div', { key: i, className: 'stat' },
    h('dt', null, tx(s.label, lang)),
    h('dd', null, s.value),
    s.source ? h('p', { className: 'src' }, s.source, s.date ? ` · ${s.date}` : '') : null)));
}
