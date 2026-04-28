# Build Runbook — Nadakki Dashboard

## Stack

- Next.js 16.2.4
- React 19.x (aligned with Next 16)
- Node.js >= 18.17
- **Build**: `next build --webpack` (script `npm run build`) para compatibilidad cuando el binario nativo SWC no está disponible (p. ej. políticas de Windows que bloquean `.node`, o entornos donde Turbopack exige bindings nativos).

## Comandos

- `npm install` — instala dependencias (incluye bindings SWC para Windows, Linux y macOS declarados en `optionalDependencies`).
- `npm run build` — build de producción con **Webpack** (`--webpack`).
- `npm run typecheck` — verificación TypeScript.
- `npm run lint` — ESLint (subset de rutas en `package.json`). Hoy: **ESLint 8** + `eslint-config-next@14` con `.eslintrc.json` (evita migración inmediata a flat config exigida por ESLint 9).
- `npm run test:run -- credit-hub` — tests del módulo Credit Hub.
- `npm run test:run -- lib` — tests de utilidades bajo `tests/lib`.

## Plataformas soportadas (bindings SWC)

- Windows x64 local: `@next/swc-win32-x64-msvc`
- Windows arm64: `@next/swc-win32-arm64-msvc`
- Vercel / Linux x64 (glibc): `@next/swc-linux-x64-gnu`
- Linux x64 (musl): `@next/swc-linux-x64-musl`
- Linux arm64: `@next/swc-linux-arm64-gnu`, `@next/swc-linux-arm64-musl`
- macOS Intel: `@next/swc-darwin-x64`
- macOS Apple Silicon: `@next/swc-darwin-arm64`

Todos quedan **pinneados** en `package.json` → `optionalDependencies` en la misma versión que `next`, para reducir el aviso de Next *"Found lockfile missing swc dependencies, patching..."* cuando `npm` no materializa todas las plataformas en el lockfile.

## Build esperado

- **Sin** el aviso de Next *"Found lockfile missing swc dependencies, patching..."* cuando el `package-lock.json` se genera con los `optionalDependencies` SWC alineados a la versión de `next`.
- En equipos Windows con **Application Control / AppLocker** que bloquean `next-swc.win32-x64-msvc.node`, Next puede mostrar *"Attempted to load @next/swc-win32-x64-msvc..."* y usar **WASM**; el build sigue pudiendo completarse con `--webpack`.
- **Recharts**: el gráfico de amortización del simulador (`AmortizationChart`) monta `ResponsiveContainer` solo en cliente con altura fija. Otras páginas con Recharts pueden seguir emitiendo avisos en SSG hasta que se les aplique el mismo patrón.

## Windows x64

- Binding nativo esperado: `@next/swc-win32-x64-msvc` (pinneado en `optionalDependencies`).

## Si reaparece el aviso de SWC

1. Confirmar que la versión de `next` en `dependencies` coincide con la de cada `@next/swc-*` en `optionalDependencies`.
2. Regenerar instalación: eliminar `node_modules` y `package-lock.json`, ejecutar `npm install`, volver a commitear el lockfile si cambió.
3. Revisar issues abiertos en [vercel/next.js](https://github.com/vercel/next.js/issues) con palabras clave `swc` y `lockfile`.
