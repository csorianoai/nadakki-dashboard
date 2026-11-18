// Plantilla Baylara (marco): shell + contenido minimo por bloques; el renderizador anade los avisos legales.
import { createElement as h, type ReactElement } from 'react';
import type { Block, I18nText, PublicMedia, PublicPage } from '@/core/types';
import { BlockError, validateBlocks } from '@/blocks/model';
import { mediaHostsFromEnv } from '../../lib/csp';
import type { RenderInput, Template } from '../index';
import { Media } from './media';
import { PROFILE_TYPE } from './profile';
import { Shell } from './shell';

const tx = (t: I18nText | undefined, lang: 'es' | 'en') => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

export function makeBaylaraTemplate(hosts: () => string[]): Template {
  return function baylaraTemplate({ manifest, lang, route, data }: RenderInput): ReactElement {
    const d = (data ?? {}) as Partial<PublicPage> & { title?: I18nText; name?: string | I18nText; media?: PublicMedia[]; photo?: PublicMedia | null };
    const blocks: Block[] = route.kind === 'page' ? validateBlocks(d.body ?? []).filter((b) => b.type !== PROFILE_TYPE) : [];
    const title = typeof d.name === 'string' ? d.name : tx(d.title ?? (d.name as I18nText | undefined), lang);
    const hero = d.media?.[0] ?? d.photo ?? undefined;
    const full = manifest.routes.find((r) => r.kind === route.kind && r.key === route.key);
    if (!full) throw new BlockError('shape');
    return h(Shell, { manifest, lang, route: full },
      hero ? h(Media, { m: hero, lang, hosts: hosts(), priority: true }) : null,
      h('h1', null, title),
      ...blocks.map((b) => h('p', { key: b.block_id }, tx(b.i18n?.text, lang) || String((b.data as { text?: unknown } | undefined)?.text ?? ''))));
  };
}

export const baylaraTemplate = makeBaylaraTemplate(() => mediaHostsFromEnv(process.env.SITES_MEDIA_HOSTS));
