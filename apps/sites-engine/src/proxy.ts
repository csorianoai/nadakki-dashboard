// Proxy de Next 16: Host -> sitio. La logica vive en src/proxy/ (pura y probada con vitest).
import { NextResponse, type NextRequest } from 'next/server';
import { CoreError, createCoreClientFromEnv } from '@/core/client';
import { cspForDeployment } from './lib/csp';
import { createHandler, type Decision } from '@/proxy/handler';
import { formCookieFor } from '@/leads/cookie';

let handler: ReturnType<typeof createHandler> | undefined;

async function decide(req: NextRequest): Promise<Decision> {
  try {
    handler ??= createHandler({ client: createCoreClientFromEnv(fetch) });
  } catch (e) {
    if (!(e instanceof CoreError)) throw e;
    return { kind: 'status', status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store', vary: 'host' } };
  }
  return handler({ url: req.url, headers: req.headers });
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const d = await decide(req);
  let res: NextResponse;
  if (d.kind === 'rewrite') {
    const url = req.nextUrl.clone();
    url.pathname = d.pathname;
    url.search = d.search;
    res = NextResponse.rewrite(url, { request: { headers: d.requestHeaders } });
    res.headers.set('content-security-policy', cspForDeployment()); // por hashes: conserva ISR (ver csp-medicion.md)
    res.headers.set('vary', 'host');
  } else if (d.kind === 'redirect') {
    res = NextResponse.redirect(d.location, d.status);
    for (const [k, v] of Object.entries(d.headers)) res.headers.set(k, v);
  } else {
    res = new NextResponse(null, { status: d.status, headers: d.headers });
  }
  res.headers.delete('set-cookie'); // nunca cookies de dominio compartido
  if (d.kind === 'rewrite') {
    // Unica cookie permitida: __Host-nk_fr (tiempo de relleno sin JS). Ver README: Set-Cookie puede degradar la cache del CDN.
    const c = formCookieFor({ method: req.method, headers: req.headers, pathname: d.pathname, secret: process.env.SITES_SITE_KEY_SECRET, now: Date.now() });
    if (c) res.headers.append('set-cookie', c);
  }
  return res;
}

// /api/revalidate tiene firma propia (ST2-04): fuera del proxy. Tampoco los estaticos de Next.
export const config = { matcher: ['/((?!api/revalidate(?:/|$)|_next/static/|_next/image/|favicon\\.ico$).*)'] };
