import { NextResponse } from 'next/server';

// "/" → /es or /en from the browser language (Spanish unless English is preferred over Spanish).
export function proxy(request) {
  const header = request.headers.get('accept-language') || '';
  const prefs = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().slice(0, 2), q: q ? Number(q) : 1 };
    })
    .filter((p) => p.lang === 'es' || p.lang === 'en')
    .sort((a, b) => b.q - a.q);
  const lang = prefs[0]?.lang || 'es';
  const res = NextResponse.redirect(new URL(`/${lang}`, request.url), 307);
  res.headers.set('Vary', 'Accept-Language');
  return res;
}

export const config = { matcher: '/' };
