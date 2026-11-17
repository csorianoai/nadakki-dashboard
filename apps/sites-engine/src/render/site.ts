// Render por manifiesto (puro, sin Next): ruta -> datos -> plantilla. Todo sale del site_id de la URL.
import type { ReactElement } from 'react';
import type { CoreClient } from '@/core/client';
import { CoreError } from '@/core/client';
import type { Lang, Manifest } from '@/core/types';
import { BlockError } from '@/blocks/model';
import { LegalError, withLegal } from './legal';
import { getTemplate } from '@/templates';

export type Route = Manifest['routes'][number];
export type Resolved = { lang: Lang; route: Route } | null;
export type Outcome =
  | { kind: 'ok'; manifest: Manifest; lang: Lang; route: Route; element: ReactElement }
  | { kind: 'not_found' }
  | { kind: 'error' }; // plantilla desconocida / bloque rechazado: pagina generica sin datos

export const slugOf = (r: Route, lang: Lang): string => r.slugs[lang] ?? r.slugs.es;

/** Idioma = primer segmento si es un idioma del sitio, si no default_language. Ruta fuera del manifiesto -> null. */
export function resolveRoute(m: Manifest, segments: string[]): Resolved {
  let lang = m.default_language;
  let rest = segments;
  if (segments.length > 0 && (m.languages as string[]).includes(segments[0])) { lang = segments[0] as Lang; rest = segments.slice(1); }
  if (rest.length > 1) return null;
  const route = rest.length === 0
    ? m.routes.find((r) => r.kind === 'page' && r.key === 'home')
    : m.routes.find((r) => slugOf(r, lang) === rest[0]);
  return route ? { lang, route } : null;
}

export const primaryHost = (m: Manifest): string => (m.hosts.find((h) => h.is_primary) ?? m.hosts[0]).host;

/** Ruta publica de una ruta del manifiesto en un idioma (el idioma por defecto va sin prefijo). */
export function pathFor(m: Manifest, lang: Lang, route: Route): string {
  const prefix = lang === m.default_language ? '' : `/${lang}`;
  if (route.kind === 'page' && route.key === 'home') return prefix || '/';
  return `${prefix}/${slugOf(route, lang)}`;
}

async function readData(c: CoreClient, id: string, r: Route): Promise<unknown> {
  switch (r.kind) {
    case 'page': return c.getPage(id, r.key);
    case 'listing': return c.getListing(id, r.key);
    case 'development': return c.getDevelopment(id, r.key);
    case 'zone': return c.getZone(id, r.key);
    default: return c.getBuilding(id, r.key);
  }
}

const CLOSED = new Set(['NOT_FOUND', 'VALIDATION_ERROR', 'SITE_UNPUBLISHED', 'HOST_NOT_FOUND']);

export async function loadManifest(c: CoreClient, siteId: string): Promise<Manifest | null> {
  try {
    const m = await c.getManifest(siteId);
    return m.site_id === siteId ? m : null; // nunca un manifiesto de otro sitio
  } catch (e) {
    if (e instanceof CoreError && CLOSED.has(e.code)) return null;
    throw e;
  }
}

export async function renderSite(c: CoreClient, siteId: string, segments: string[]): Promise<Outcome> {
  const manifest = await loadManifest(c, siteId);
  if (!manifest) return { kind: 'not_found' };
  const hit = resolveRoute(manifest, segments);
  if (!hit) return { kind: 'not_found' };
  const template = getTemplate(manifest.template.id, manifest.template.version);
  if (!template) return { kind: 'error' };
  try {
    const data = await readData(c, siteId, hit.route);
    return { kind: 'ok', manifest, ...hit, element: withLegal(manifest, hit.lang, template({ manifest, lang: hit.lang, route: hit.route, data })) };
  } catch (e) {
    if (e instanceof BlockError || e instanceof LegalError) return { kind: 'error' };
    if (e instanceof CoreError && CLOSED.has(e.code)) return { kind: 'not_found' };
    throw e;
  }
}

/** Metadatos: canonical SIEMPRE al primary_host del manifiesto (nunca al Host entrante). */
export function buildMetadata(m: Manifest, lang: Lang, route: Route, env: { vercelEnv?: string }) {
  const origin = `https://${primaryHost(m)}`;
  const languages: Record<string, string> = {};
  for (const l of m.languages) languages[l] = origin + pathFor(m, l, route);
  const noindex = !m.indexable || env.vercelEnv !== 'production';
  return {
    title: m.name[lang] ?? m.name.es,
    alternates: { canonical: origin + pathFor(m, lang, route), languages },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
