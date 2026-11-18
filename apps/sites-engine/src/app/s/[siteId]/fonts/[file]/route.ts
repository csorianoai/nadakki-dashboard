// Fuentes locales de la plantilla Baylara, same-origin. Lista cerrada de ficheros: nada del cliente llega al sistema de ficheros.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { FONT_FILES } from '@/templates/baylara/fonts';

export async function GET(_req: Request, ctx: { params: Promise<{ siteId: string; file: string }> }): Promise<Response> {
  const { file } = await ctx.params;
  if (!Object.prototype.hasOwnProperty.call(FONT_FILES, file)) return new Response(null, { status: 404 });
  const buf = await readFile(path.join(process.cwd(), 'src/templates/baylara/fonts', file));
  return new Response(new Uint8Array(buf), { headers: { 'content-type': 'font/woff2', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}
