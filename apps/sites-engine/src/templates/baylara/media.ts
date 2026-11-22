// <picture> avif+webp desde PublicMedia.variants (Media.js:6-21). Solo https de SITES_MEDIA_HOSTS; sin alt ES/EN no se pinta.
// El credito se muestra SOLO si quien llama lo pide (donde Baylara ya lo muestra): ningun credito visible nuevo.
import { createElement as h, type ReactElement } from 'react';
import type { Lang, PublicMedia } from '@/core/types';

export function allowedMediaUrl(url: string, hosts: string[]): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && hosts.includes(`https://${u.host.toLowerCase()}`);
  } catch { return false; }
}

export interface MediaProps {
  m: PublicMedia; lang: Lang; hosts: string[]; priority?: boolean; sizes?: string; credit?: boolean; className?: string;
}

export function Media({ m, lang, hosts, priority = false, sizes = '100vw', credit = false, className = 'media' }: MediaProps): ReactElement | null {
  if (!m.alt?.es?.trim() || !m.alt?.en?.trim()) return null;
  const vs = (m.variants ?? []).filter((v) => allowedMediaUrl(v.url, hosts)).sort((a, b) => a.width - b.width);
  if (vs.length === 0) return null;
  const set = (f: string) => vs.filter((v) => v.format === f).map((v) => `${v.url} ${v.width}w`).join(', ');
  const fb = vs.filter((v) => v.format === 'webp' || v.format === 'jpeg');
  const fallback = fb.find((v) => v.width >= 1024) ?? fb[fb.length - 1] ?? vs[vs.length - 1];
  const pic = h('picture', null,
    set('avif') ? h('source', { type: 'image/avif', srcSet: set('avif'), sizes }) : null,
    set('webp') ? h('source', { type: 'image/webp', srcSet: set('webp'), sizes }) : null,
    h('img', { src: fallback.url, width: m.width ?? undefined, height: m.height ?? undefined, alt: m.alt[lang], className, decoding: 'async',
      loading: priority ? 'eager' : 'lazy', fetchPriority: priority ? 'high' : undefined }));
  return credit && m.credit ? h('figure', null, pic, h('figcaption', { className: 'dcredit' }, m.credit)) : pic;
}
