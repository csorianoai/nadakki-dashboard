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
