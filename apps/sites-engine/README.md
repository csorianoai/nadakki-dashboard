# @nadakki/sites-engine

Motor multi-host de sitios publicos de Nadakki Sites (S2). Proyecto de Vercel **separado** del panel
(Root Directory `apps/sites-engine`). Autocontenido: no importa nada del panel.

## Como correr
```
cd apps/sites-engine
npm ci
npm run typecheck && npm run lint && npm test
npm run dev        # http://localhost:3000/health
```
Evidencia del loop (desde la raiz del repo): `npx playwright test --config apps/sites-engine/playwright.config.ts --grep ST2-01`.
El envoltorio `e2e/ci-gate.spec.ts` ejecuta `npm ci` y `vitest run` por cada `spec/st2-NN-*/` y falla con fallos,
skips, todo, 0 tests o (desde ST2-02) ficheros sin casos `[positivo]`, `[negativo]` y `[tenant-ajeno]`.

## Aislamiento del panel
- `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `package.json` y lockfile propios; alias `@/*` -> `./src/*`.
- El jest y el tsconfig de la raiz ignoran `apps/`. Las pruebas viven en `spec/` (nunca `tests/` ni `*.test.*`).
- `spec/st2-01-andamiaje` escanea `src/`, `spec/` y `e2e/` y falla si un import sale de la carpeta o si el `name` es `nadakki-dashboard`.
- `reference/` es una instantanea de solo lectura de Baylara: excluida de tsc y eslint.

## Mover a repo propio
```
git subtree split --prefix=apps/sites-engine -b sites-engine-split
git push <nuevo-repo> sites-engine-split:main
```
No hay rutas ni dependencias hacia el panel, asi que el contenido funciona tal cual en la raiz del nuevo repo.

## Revalidacion firmada (ST2-04)
`POST /api/revalidate` (fuera del proxy) recibe el evento firmado del core: `X-Nadakki-Signature: v1=hex(HMAC-SHA256(secreto, timestamp + '.' + cuerpo_crudo))`
(con rotacion, dos `v1` separados por coma), ventana +-300 s, comparacion en tiempo constante, secretos en `SITES_REVALIDATE_SECRETS` (JSON `{keyId: secreto}`, nunca impresos).
204 aceptado · 401 firma/ventana/Key-Id · 400 cuerpo fuera de contrato. Dedupe por `event_id` y descarte de `content_version` menor, por instancia (idempotente).
Solo se invalidan etiquetas del `site_id` del evento. El manifiesto se lee con la etiqueta `site:<id>` (ST2-02), asi que page/listing/development/zone/building/media
invalidan su etiqueta y `site:<id>`; `host` solo `host:<host>`.
**Eleccion de Next 16.4:** `revalidateTag(tag, { expire: 0 })` (expiracion inmediata: la siguiente visita espera contenido fresco). No se usa el perfil
stale-while-revalidate (`'max'`) porque el objetivo es publicar -> visible en < 5 s; `updateTag` solo existe en Server Actions.

## Formularios (ST2-05)
`POST /api/lead` same-origin de cada host (el proxy lo reescribe a `/s/<site_id>/api/lead`; el `site_id` sale SOLO del host, nunca del cuerpo).
Acepta `application/x-www-form-urlencoded` (sin JS -> 303 a `/es/mensaje-enviado|/en/message-sent` o `.../mensaje-no-enviado|/en/message-not-sent`) y JSON (`{ok}`).
Origin/Sec-Fetch-Site ajeno -> 403; cuerpo > 16 KiB -> 413; `tenant_id` en el cuerpo -> rechazo. Env: `SITES_CORE_URL`, `SITES_SITE_KEY_SECRET` (nunca impresa).
- **Idempotency-Key**: la genera el motor (UUID v4 por envio, guardada en el item del `LeadOutbox`); nunca va en el HTML (la pagina ISR es compartida). Mismo cuerpo en 60 s -> misma clave.
- **Antispam**: honeypot `company_website` (y `website` de Baylara) y envio < 3 s -> falso exito (303 a "enviado") sin llamar al core. Sin JS el tiempo lo da la cookie firmada `__Host-nk_fr` que emite el proxy en la navegacion GET; con JS, `form_rendered_at` fijado por el navegador. Sin ninguno de los dos -> no-enviado (no se inventa).
- **PENDIENTE DE MEDICION (solo en Vercel)**: si `Set-Cookie` en la navegacion degrada la cache del CDN. Si la degrada, el respaldo es honeypot + limites del core (sin cookie el motor respondera no-enviado, por lo que habria que pasar el tiempo minimo al core); la medicion decide.
- **Reintentos**: dentro de la peticion, max 3, backoff 200/800 ms, tope 8 s, solo red/408/429/5xx con la misma clave; 429 respeta Retry-After; 4xx no se reintenta.
- **Pasos humanos**: el almacen DURABLE del outbox es decision humana (hoy en memoria por instancia). Sin 202 del core la respuesta es no-enviado, nunca "enviado".
- **Discrepancia**: las `text_version` de consentimiento no viajan en C-SITES-RENDER; son constante versionada de la plantilla (`src/leads/consent.ts`) y deben coincidir con el texto mostrado.

## Plantilla Baylara, marco 1/3 (ST2-06)
- **Tokens** (`src/templates/baylara/theme.ts`): esquema de `manifest.theme` de esta plantilla = objeto plano con los 14 colores y `pad`/`section` de `globals.css:2-17` (`navy`, `gold`, `on-navy-2`...). Lista blanca; hex `#rrggbb` o medida `Npx`/`clamp(Npx, Nvw, Npx)`; invalido -> valor de la plantilla. Se sirve en `/theme.css` (same-origin, la CSP no admite estilos en linea).
- **Discrepancia**: C-SITES-RENDER deja `theme` sin esquema y E6:45 propone `color.primary...`; aqui se fija el de la plantilla.
- **Bloques legales** (`src/render/legal.ts`): los inyecta el renderizador tras CUALQUIER plantilla. `required_blocks` desconocido, `legal` incompleto o falta la pagina `privacy` -> pagina generica de error, nunca un sitio sin avisos.
- Pendiente en 2/3 y 3/3: shell, `baylara.profile`, fuentes locales, `<picture>`, sitemap.xml/robots.txt.
