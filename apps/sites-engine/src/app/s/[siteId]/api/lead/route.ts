// POST same-origin /api/lead de cada host (el proxy lo reescribe a /s/<site_id>/api/lead). Sin JS: urlencoded -> 303.
import { handleLead } from '@/leads/handler';
import { createMemoryOutbox } from '@/leads/outbox';

export const dynamic = 'force-dynamic';

// El almacen DURABLE es decision humana (README): hasta entonces, outbox en memoria por instancia.
const outbox = createMemoryOutbox();

export async function POST(req: Request, ctx: { params: Promise<{ siteId: string }> }): Promise<Response> {
  const { siteId } = await ctx.params;
  return handleLead(req, siteId, {
    fetch,
    baseUrl: process.env.SITES_CORE_URL ?? '',
    secret: process.env.SITES_SITE_KEY_SECRET ?? '', // nunca impresa
    outbox,
  });
}
