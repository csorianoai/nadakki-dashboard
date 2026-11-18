// Pagina de sitio por manifiesto con ISR bajo demanda (nada se prerenderiza: 1.000 sitios x ~120 paginas no caben en SSG).
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createCoreClientFromEnv, type CoreClient } from '@/core/client';
import { buildMetadata, loadManifest, renderSite, resolveRoute } from '@/render/site';

export const revalidate = 60;
export const dynamicParams = true;
export function generateStaticParams(): [] { return []; }

let client: CoreClient | undefined;
const core = (): CoreClient => (client ??= createCoreClientFromEnv(fetch));

interface Props { params: Promise<{ siteId: string; slug?: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId, slug = [] } = await params;
  const m = await loadManifest(core(), siteId);
  const hit = m && resolveRoute(m, slug);
  if (!m || !hit) return { title: 'No encontrado', robots: { index: false } };
  return buildMetadata(m, hit.lang, hit.route, { vercelEnv: process.env.VERCEL_ENV });
}

export default async function SitePage({ params }: Props) {
  const { siteId, slug = [] } = await params;
  const out = await renderSite(core(), siteId, slug);
  if (out.kind === 'not_found') notFound();
  if (out.kind === 'error') return <main><h1>Contenido no disponible</h1></main>;
  return out.element;
}
