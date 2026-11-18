/* global URL */
// Core simulado de ST2-08: sirve contenido SINTETICO (cero red, cero datos de clientes) con CSP por hash.
import { createServer } from 'node:http';
import { scriptHash } from './csp.mjs';

const INLINE = 'document.documentElement.dataset.ready="1"';
const TEXT = { es: ['Sitio de prueba', 'Contenido sintetico de la ruta'], en: ['Test site', 'Synthetic route content'] };

export function pageHtml(siteId, pathname, defect) {
  const lang = pathname.startsWith('/en') ? 'en' : 'es';
  const [title, body] = TEXT[lang];
  const img = defect === 'img-sin-alt' ? '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="40" height="40">' : '';
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} ${siteId}</title>`
    + '</head>'
    + `<body><header><nav aria-label="Principal"><a href="/${lang}">Inicio</a></nav></header><main><h1>${title}</h1><p>${body}: ${pathname}</p>${img}</main>`
    + `<script>${INLINE}</script></body></html>`;
}

/** defect: 'sin-csp' | 'img-sin-alt' | undefined. */
export async function startTestServer({ siteId = 'sitio-a', defect } = {}) {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url ?? '/', 'http://x').pathname;
    const headers = { 'content-type': 'text/html; charset=utf-8' };
    if (defect !== 'sin-csp') headers['content-security-policy'] = `default-src 'self'; script-src 'self' '${scriptHash(INLINE)}'; style-src 'self'; img-src 'self' data:`;
    res.writeHead(200, headers).end(pageHtml(siteId, pathname, defect));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => { server.closeAllConnections(); server.close(r); }) };
}
