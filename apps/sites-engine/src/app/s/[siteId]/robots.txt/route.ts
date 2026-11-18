// /robots.txt de cada host (el proxy lo reescribe a /s/<site_id>/robots.txt). Solo del site_id de la URL.
import { createCoreClientFromEnv, type CoreClient } from '@/core/client';
import { loadManifest } from '@/render/site';
import { robotsTxt } from '@/render/seo';

export const revalidate = 60;
let client: CoreClient | undefined;

export async function GET(_req: Request, ctx: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await ctx.params;
  const m = await loadManifest((client ??= createCoreClientFromEnv(fetch)), siteId);
  if (!m) return new Response(null, { status: 404 });
  return new Response(robotsTxt(m, { vercelEnv: process.env.VERCEL_ENV }), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, s-maxage=60', 'x-content-type-options': 'nosniff' } });
}
