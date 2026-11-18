// Render por manifiesto (puro, sin Next): ruta -> datos -> plantilla. Todo sale del site_id de la URL.
import type { ReactElement } from 'react';
import type { CoreClient } from '@/core/client';
import { CoreError } from '@/core/client';
import type { Lang, Manifest } from '@/core/types';
import { BlockError } from '@/blocks/model';
import { LegalError, withLegal } from './legal';
import { getTemplate, type EntityLists } from '@/templates';

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

export const LIST_BLOCK = 'baylara.entity_list';
export const LIST_MAX = 60;
const LIST_DEFAULT = 12;

/** Lee del core (siempre con el site_id de la URL) las listas que piden los bloques de la pagina. Datos invalidos: se omiten y el bloque falla cerrado. */
async function readLists(c: CoreClient, id: string, page: unknown): Promise<EntityLists> {
  const out: EntityLists = {};
  const body = (page as { body?: unknown })?.body;
  if (!Array.isArray(body)) return out;
  for (const b of body) {
    if (!b || b.type !== LIST_BLOCK || typeof b.block_id !== 'string') continue;
    const d = (b.data ?? {}) as { source?: unknown; limit?: unknown; featured_only?: unknown };
    const limit = Number.isInteger(d.limit) && (d.limit as number) >= 1 && (d.limit as number) <= LIST_MAX ? (d.limit as number) : LIST_DEFAULT;
    const q = { limit };
    switch (d.source) {
      case 'listings': out[b.block_id] = { source: 'listings', items: (await c.listListings(id, d.featured_only === true ? { ...q, featured: true } : q)).items }; break;
      case 'developments': out[b.block_id] = { source: 'developments', items: (await c.listDevelopments(id, q)).items }; break;
      case 'zones': out[b.block_id] = { source: 'zones', items: (await c.listZones(id, q)).items }; break;
      case 'buildings': out[b.block_id] = { source: 'buildings', items: (await c.listBuildings(id, q)).items }; break;
      default: break;
    }
  }
  return out;
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
    const lists = hit.route.kind === 'page' ? await readLists(c, siteId, data) : undefined;
    return { kind: 'ok', manifest, ...hit, element: withLegal(manifest, hit.lang, template({ manifest, lang: hit.lang, route: hit.route, data, lists })) };
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
