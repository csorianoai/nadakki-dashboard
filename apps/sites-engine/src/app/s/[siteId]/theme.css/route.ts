// /theme.css de cada host (el proxy lo reescribe a /s/<site_id>/theme.css): tokens del sitio, same-origin por la CSP. Solo del site_id de la URL.
import { createCoreClientFromEnv, type CoreClient } from '@/core/client';
import { loadManifest } from '@/render/site';
import { themeCss } from '@/templates/baylara/theme';

export const revalidate = 60;
let client: CoreClient | undefined;

export async function GET(_req: Request, ctx: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await ctx.params;
  const m = await loadManifest((client ??= createCoreClientFromEnv(fetch)), siteId);
  if (!m) return new Response(null, { status: 404 });
  return new Response(themeCss(m.theme), { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, s-maxage=60', 'x-content-type-options': 'nosniff' } });
}
