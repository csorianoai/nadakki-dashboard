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
