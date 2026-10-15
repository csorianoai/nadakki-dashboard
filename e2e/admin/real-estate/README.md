# e2e/admin/real-estate

Prueba visual de `/admin/real-estate` (RESULT_O3_D_ADMIN_REAL_ESTATE).

    npx playwright test --config e2e/admin/real-estate/playwright.config.ts e2e/admin/real-estate/admin-real-estate.spec.ts

Requisitos del entorno: Chromium de Playwright con sus librerías del sistema (libnspr4, libnss3…).
Si el runner no tiene sudo, `npx playwright install --with-deps chromium` aborta con
`sudo: a password is required` antes de lanzar ningún caso: es un fallo de entorno, no de la pantalla.
Instala las librerías del sistema en la imagen del runner o usa `npx playwright install chromium` si ya están.
