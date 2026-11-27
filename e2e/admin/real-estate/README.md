# e2e/admin/real-estate

Prueba visual de `/admin/real-estate` (RESULT_O3_D_ADMIN_REAL_ESTATE).

    npx playwright test --config e2e/admin/real-estate/playwright.config.ts e2e/admin/real-estate/admin-real-estate.spec.ts

Requisitos del entorno: Chromium de Playwright con sus librerías del sistema (libnspr4, libnss3…).
Si el runner no tiene sudo, `npx playwright install --with-deps chromium` aborta con
`sudo: a password is required` antes de lanzar ningún caso: es un fallo de entorno, no de la pantalla.
Instala las librerías del sistema en la imagen del runner o usa `npx playwright install chromium` si ya están.

Verificación local (2026-11-27, Chromium ya instalado, `CI=1 NODE_OPTIONS=--max-old-space-size=6144`):
7 casos en verde y `RESULT_O3_D_ADMIN_REAL_ESTATE=PASS`. El `webServer` hace dos builds de producción
(con y sin DEMO) y tarda ~9 min en total: la evidencia necesita heap de Node ampliado y un tiempo
de espera amplio; un timeout o un OOM del build es un fallo de entorno, no de la pantalla.
