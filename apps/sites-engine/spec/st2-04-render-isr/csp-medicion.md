# ST2-04 — Medición CSP: nonce por petición vs hashes con ISR

Medido el 2026-11-16 con `next build` + `next start` (Next 16.4.5) sobre la página `/s/[siteId]/[[...slug]]`
(`revalidate = 60`, `generateStaticParams() => []`) y un core simulado local (fixtures de ST2-02, 0 red real).

## Medición 1 — HTML emitido por la ruta ISR (sin CSP)
- Build: la ruta sale como `● /s/[siteId]/[[...slug]]` (ISR bajo demanda); `x-nextjs-cache: MISS` y luego `HIT`.
- El HTML trae 11 `<script>`, **5 inline**: 2 constantes de build (arranque Turbopack, `self.__next_f=...push([0])`)
  y 3 de payload RSC (`self.__next_f.push([1,...])`) cuyo contenido **varía por página** (hashes distintos en `/sobre-mi` y `/en/about`).

## Medición 2 — nonce por petición aplicado desde `proxy.ts`
- Petición 1: `Content-Security-Policy: ... 'nonce-W8us…'`, HTML con `nonce="W8us…"` (MISS).
- Petición 2 (mismo recurso): cabecera con **otro** nonce `'nonce-xE3o…'` pero el HTML servido desde caché (`x-nextjs-cache: HIT`)
  conserva `nonce="W8us…"` → los scripts quedarían **bloqueados por la propia CSP**.
- Para que el nonce funcione habría que renderizar en cada petición (sin ISR/CDN): 1.000 sitios × ~120 páginas sin caché. Descartado.

## Elección: hashes (conserva ISR)
- `script-src 'self'` + hashes `sha256-…` tomados de `SITES_CSP_SCRIPT_HASHES` (env del despliegue, no del sitio ni de la petición).
- Sin `'unsafe-inline'` ni `'unsafe-eval'`. `img-src` = `'self' data:` + `SITES_MEDIA_HOSTS` del despliegue. Terceros: lista fija en `src/lib/csp/index.ts` (vacía hoy).
- La cabecera se pone en `src/proxy.ts` (solo respuestas reescritas a un sitio; las 404/503 del proxy no llevan HTML).

## Límite abierto (honesto)
Los 2 scripts inline constantes se pueden listar en `SITES_CSP_SCRIPT_HASHES` tras cada build. Los 3 de payload RSC cambian con el
contenido de cada página, así que un hash de build no los cubre: con esta política el HTML del sitio (solo contenido, sin JS de cliente
necesario) se ve completo, pero la hidratación de React queda bloqueada. Las plantillas de ST2-06 deben ser HTML de servidor puro.
Si se quisiera hidratar haría falta un mecanismo de hash por página; no se resuelve en esta tarea.
