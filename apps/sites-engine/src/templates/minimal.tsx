import { createElement, type ReactElement } from 'react';
import type { Block, I18nText, PublicPage } from '@/core/types';
import { validateBlocks } from '@/blocks/model';
import type { RenderInput } from './index';

const tx = (t: I18nText | undefined, lang: 'es' | 'en') => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

/** Plantilla minima de prueba: solo texto (React escapa todo). La real llega en ST2-06. */
export function minimalTemplate({ manifest, lang, route, data }: RenderInput): ReactElement {
  const d = (data ?? {}) as Partial<PublicPage> & { title?: I18nText; name?: string | I18nText };
  const blocks: Block[] = route.kind === 'page' ? validateBlocks(d.body ?? []) : [];
  const title = typeof d.name === 'string' ? d.name : tx(d.title ?? (d.name as I18nText | undefined), lang);
  return createElement('main', { 'data-template': 'minimal', lang },
    createElement('h1', null, title),
    createElement('p', null, tx(manifest.name, lang)),
    ...blocks.map((b) => createElement('p', { key: b.block_id }, tx(b.i18n?.text, lang) || String((b.data as { text?: unknown } | undefined)?.text ?? ''))));
}
