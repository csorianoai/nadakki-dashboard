# Build Runbook — Nadakki Dashboard

## Stack

- Next.js 16.2.4
- React 19.x (aligned with Next 16)
- Node.js >= 18.17

## Scripts de build (dualidad)

| Script | Comando | Cuándo usarlo |
|--------|---------|----------------|
| **`npm run build`** | `next build` | **Vercel (Linux)** y **CI en runners Linux/macOS** con SWC nativo: Turbopack por defecto, máximo rendimiento. |
| **`npm run build:turbopack`** | `next build --turbopack` | Mismo motor que `build`, explícito en documentación o pipelines que quieren el flag visible. |
| **`npm run build:webpack`** | `next build --webpack` | **Windows corporativo** con **Application Control / AppLocker** que bloquea `@next/swc-win32-x64-msvc.node`: evita depender de Turbopack cuando no hay bindings nativos (WASM-only es más lento; Webpack suele ser más estable aquí). |

### Por qué esta dualidad

- **Application Control** en Windows puede bloquear el `.node` de SWC; Next intenta WASM y Turbopack puede fallar o degradarse.
- **Linux (Vercel)** no aplica esa política: SWC nativo + **Turbopack** es lo más rápido.
- **`vercel.json`** fija `buildCommand` a **`next build`** para que el deploy no herede accidentalmente un `package.json` orientado solo a Webpack.

## Vercel

- El proyecto define **`vercel.json`** con `"buildCommand": "next build"` (Turbopack en plataformas soportadas por Next).
- El script **`build`** en `package.json` coincide con ese comando para desarrolladores que ejecutan `npm run build` en entornos compatibles.

## Comandos habituales

- `npm install` — instala dependencias (incluye `optionalDependencies` SWC alineados a la versión de `next`).
- `npm run typecheck` — TypeScript.
- `npm run lint` — ESLint (subset en `package.json`). **ESLint 8** + `eslint-config-next@14` + `.eslintrc.json`.
- `npm run test:run -- credit-hub` / `npm run test:run -- lib` — tests Jest.

## Plataformas soportadas (bindings SWC)

Pinneados en `package.json` → `optionalDependencies` (misma versión que `next`):

- Windows x64: `@next/swc-win32-x64-msvc`
- Windows arm64: `@next/swc-win32-arm64-msvc`
- Linux (Vercel glibc): `@next/swc-linux-x64-gnu`
- Linux musl / arm64 / darwin: ver lista en `package.json`.

Objetivo: evitar el aviso *"Found lockfile missing swc dependencies, patching..."* cuando el lockfile incluye los opcionales.

## Build esperado

- Sin aviso de **lockfile SWC incompleto** (tras `npm install` con lockfile generado con opcionales).
- En Windows con políticas que bloquean el binario nativo: usar **`npm run build:webpack`** (no confiar en `npm run build` local si AppControl rompe Turbopack).
- **Recharts**: el simulador (`AmortizationChart`) monta el chart tras hidratar con altura fija; otras páginas con Recharts pueden aún loguear avisos en SSG.

## Si reaparece el aviso de SWC en el lockfile

1. Alinear versión de `next` con cada `@next/swc-*` en `optionalDependencies`.
2. Regenerar: borrar `node_modules` y `package-lock.json`, `npm install`, commitear lockfile si cambia.
3. Consultar [issues de Next.js](https://github.com/vercel/next.js/issues) (palabras clave: `swc`, `lockfile`).
