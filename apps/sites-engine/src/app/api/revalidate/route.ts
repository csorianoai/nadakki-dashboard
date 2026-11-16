// POST /api/revalidate: Core -> motor. Firma HMAC propia (el proxy excluye esta ruta). Sin cuerpo ni PII en logs.
import { revalidateTag } from 'next/cache';
import { createRevalidateHandler, parseSecrets } from '@/revalidate/handler';

export const dynamic = 'force-dynamic';

let handler: ReturnType<typeof createRevalidateHandler> | undefined;

export async function POST(req: Request): Promise<Response> {
  // Secretos leidos por peticion de env (rotacion sin redeploy de codigo); el handler se rehace si cambian.
  const raw = process.env.SITES_REVALIDATE_SECRETS;
  if (!handler || raw !== currentRaw) {
    currentRaw = raw;
    handler = createRevalidateHandler({
      secrets: parseSecrets(raw),
      // Revalidacion INMEDIATA ({ expire: 0 }): la entrada se expira ya; la siguiente visita espera contenido fresco.
      revalidate: (tag) => { revalidateTag(tag, { expire: 0 }); },
    });
  }
  const { status } = await handler({ headers: req.headers, body: await req.text() });
  return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
}

let currentRaw: string | undefined;
