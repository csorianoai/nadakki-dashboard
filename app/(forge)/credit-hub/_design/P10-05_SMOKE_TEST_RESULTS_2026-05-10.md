# P10-05 Smoke Test Results

**Date:** 2026-05-10
**Tester:** Cowork agent (Claude in Chrome MCP + static analysis)
**Branch:** `feat/forge-cowork-2026-05-09-pivot`
**Commit base:** `c83fd35`
**Status:** ⚠️ **FASE 1 COMPLETADA — STOP por 4 bugs críticos. Fases 2-4 NO ejecutadas (pendientes de fix).**

---

## Summary

- Tests run: 1 (Phase 1 diagnosis)
- Pass: 0
- Fail: 1 (the underlying P10-05 fetch never reaches the backend — chrome stays default)
- Critical bugs found: **4** (plus 1 backend data quality flag)
- **Recommendation:** Do NOT proceed to PR. Fix BUG-001 + BUG-002 + BUG-003 first; BUG-004 is a separate hydration issue surfaced during diagnosis. Phase 2-4 only meaningful AFTER these fixes.

---

## FASE 1 — Tenant ID diagnosis

### Setup verified live in browser
- Dev server `localhost:3000` reachable, page `/credit-hub/dealer` rendered
- Backend `localhost:8010` reachable, returns `200 OK` with valid `TenantBranding` shape when called with slug `credicefi`
- Backend `localhost:8000` responds `404 {"detail":"Not Found"}` — endpoint NOT mounted on that port (informational; matches Cesar's PowerShell test against `:8010`)

### What the frontend actually does
| Field | Observed value |
|---|---|
| `useTenant().tenantId` | `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` (UUID, **NOT** slug) |
| Source of tenantId | Fallback chain: `useDashboardTenant()` → `process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID` → **`DEFAULT_CREDIT_TENANT_ID`** hardcoded constant in `lib/credit-hub/types/creditCore.ts:18` |
| `localStorage.nadakki_tenant_id` | `null` (no auth session active) |
| `localStorage.nadakki_sic_token` | `null` (no JWT) |
| Network requests to `/api/v2/tenants/.../branding` | **0** (zero — fetch never reached the backend) |
| Network requests to `/api/` (other) | 3, all `404` to `localhost:3000/api/v2/credit/applications` etc. (other clients use `NEXT_PUBLIC_API_URL` which is also undefined → relative paths → dev server returns 404 HTML) |
| Console: `useTenantConfig deprecated` warning | **1** time (proxy IS active, working as designed) |
| `data-tenant` on shell DOM | `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` (UUID set on inner `<div>`, NOT on `.forge-app` parent) |
| Inline `style` with CSS vars on shell | `null` (because `branding === null`, never resolved) |
| Computed `--forge-brand-500` | `#2e5f97` (Forge default, NOT Credicefi `#1b4a8c`) |
| Banner rojo visible | **NO** — but `useTenantBranding` likely in `isError` after retries; banner mount may be blocked by hydration error |
| Greeting text | `"Buenas noches, Institución financiera"` (default DO institution_name from fallback) |

### Direct fetch test (via JS console, bypasses react-query)
| URL | Result |
|---|---|
| `http://localhost:3000/api/v2/tenants/0a91ee98-2dbe-46d0-a43c-3fc2dbd42242/branding` | `404` HTML page (relative path → Next.js dev server, no backend proxy) |
| `http://localhost:3000/api/v2/tenants/credicefi/branding` | `404` HTML page (same reason) |
| `http://localhost:8000/api/v2/tenants/credicefi/branding` | `404 {"detail":"Not Found"}` — endpoint not mounted there |
| `http://localhost:8010/api/v2/tenants/credicefi/branding` | **`200 OK`** with full `TenantBranding` JSON ✅ |

### Conclusion of Phase 1
**Mismatch detectado: SÍ — múltiple capa.**

1. **Tenant identity mismatch** (UUID vs slug)
2. **Env var name mismatch** (`NEXT_PUBLIC_API_BASE_URL` vs `NEXT_PUBLIC_API_URL` vs nothing)
3. **CSS scope mismatch** (`data-tenant` on inner div, not on `.forge-app`)

Cualquiera de los 3 individualmente rompe el flujo. Los 3 al mismo tiempo = chrome muestra defaults siempre.

---

## FASE 2 — 5 Escenarios

⚠️ **NOT EXECUTED.** Phase 1 reveals foundational bugs that make all 5 scenarios meaningless until fixed:
- Escenario 1 (deprecation warning): would PASS (warning aparece 1x, observado).
- Escenario 2 (success 200): would FAIL (no fetch reaches backend).
- Escenario 3 (error 404): de facto este IS the current state. Banner not visible → indica que el banner mount tiene su propio bug (BUG-004 hydration).
- Escenario 4 (tenant switch): irrelevant until success state works.
- Escenario 5 (reduced motion): orthogonal, valido independiente; NO ejecutado.

---

## FASE 3 — Interaction button-by-button

⚠️ **NOT EXECUTED.** Phase 1 stop rule (5+ críticos = parar).

---

## FASE 4 — Bugs propuestos para fix

### BUG-001 · Tenant identity is UUID, backend expects slug · 🔴 CRÍTICO
- **Síntoma:** Frontend `useTenant()` retorna `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` (UUID hardcodeado en `DEFAULT_CREDIT_TENANT_ID`). Backend expone endpoints por slug (`credicefi`, `banco-piloto-rd`). Aunque el fetch llegara, sería `404`.
- **Causa raíz:** `lib/credit-hub/types/creditCore.ts:18` define `DEFAULT_CREDIT_TENANT_ID = "0a91ee98-..."`. `useTenant.ts:12-13` lo usa como fallback final. **Resolved per Phase 1.5 BLOCKER doc** como "canonical Credicefi tenant id" (correcto a nivel sistema), pero el endpoint `/branding` nuevo expone por slug (no por UUID), creando mismatch de superficie.
- **Archivo afectado:**
  - `lib/credit-hub/hooks/useTenant.ts` (devolver slug además del UUID)
  - O alternativamente: `lib/credit-hub/api/tenant-branding-client.ts` (resolver slug desde UUID antes del fetch)
  - O: `lib/credit-hub/types/creditCore.ts` (cambiar default a slug "credicefi" — riesgo de romper otros consumers que usan el UUID para llamadas auth)
- **Fix propuesto (recomendado):** Extender `useTenant()` para retornar también `tenantSlug` REAL (no `tenantSlug = tenantId`). Mapping local `UUID → slug` con tabla mínima `{ "0a91ee98-...": "credicefi", "550e8400-...": "banco-piloto-rd" }` (fixtures conocidos). Cliente `tenant-branding-client.ts` usa `tenantSlug` en URL en lugar de `tenantId`. **Mejor de fondo:** que el backend acepte ambos (slug + UUID) en path param y resuelva internamente — eso evita maintain map en el frontend.
- **Estimación:** 30 min frontend (mapping table) + 1 hr coordinación con Ramon si elige fix backend
- **Bloqueador para:** PR a main · smoke test escenarios 2/4

### BUG-002 · Env var `NEXT_PUBLIC_API_BASE_URL` no se usa en el resto del repo · 🔴 CRÍTICO
- **Síntoma:** El cliente `tenant-branding-client.ts:7,103-108` lee `process.env.NEXT_PUBLIC_API_BASE_URL`. Si no está definida → throw síncrono `"NEXT_PUBLIC_API_BASE_URL is not defined"` → react-query la wrappea en `TenantBrandingNetworkError` → eventually `isError`. **Pero el resto del repo (8+ archivos) usa `NEXT_PUBLIC_API_URL`.** Si el `.env.local` solo tiene `NEXT_PUBLIC_API_URL` (lo más probable), mi cliente falla siempre.
- **Causa raíz:** Discrepancia entre `_API_CONTRACT.md` (que documenta `NEXT_PUBLIC_API_BASE_URL`) y la convención efectiva del repo (`NEXT_PUBLIC_API_URL` en `lib/credit-api.ts`, `lib/api/spyfu-client.ts`, `lib/api/document-intelligence.ts`, `lib/api/autopilot.ts`, `lib/scheduler-status.ts`, `lib/legal/telemetry.ts`, `lib/credit-hub/api/public-consent-client.ts`). Yo seguí el contrato; el contrato no refleja la realidad del repo.
- **Archivo afectado:** `lib/credit-hub/api/tenant-branding-client.ts:7,105`
- **Fix propuesto:** Cambiar a fallback chain:
  ```typescript
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_NADAKKI_API_BASE;
  ```
  Y actualizar mensaje de error a "API base URL is not defined (NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL)". **Doc fix paralelo:** alinear `_API_CONTRACT.md` para listar las 3 var names aceptadas con preferencia documentada.
- **Estimación:** 5 min código + 5 min doc
- **Bloqueador para:** PR a main · smoke test todos los escenarios (sin esto, el fetch nunca arranca)

### BUG-003 · `data-tenant` aplicado en hijo de `.forge-app`, no en el mismo elemento · 🔴 CRÍTICO
- **Síntoma:** `tokens.css` define overrides como `.forge-app[data-tenant="credicefi"] { --forge-brand-500: #1b4a8c }`. El selector requiere ambos atributos en el **mismo elemento**. En el DOM real, `.forge-app` está en un wrapper (línea de `app/(forge)/layout.tsx`) y `data-tenant` está en un `<div>` hijo (mi `ForgeCreditHubAppShell`). El selector no matchea → overrides nunca aplican → CSS vars caen al default `.forge-app { --forge-brand-500: #2e5f97 }`.
- **Evidencia DOM (real):**
  ```
  <body>
    <div class="... forge-app antialiased">                          ← .forge-app, sin data-tenant
      <div data-tenant="0a91ee98-..." data-portal="dealer" ...>      ← data-tenant aquí, sin .forge-app
        ... contenido ...
      </div>
    </div>
  </body>
  ```
- **Causa raíz:** El `ForgeCreditHubAppShell` que el agent escribió en P10-05 setea `data-tenant` en el wrapper INTERIOR. El `.forge-app` class está en el layout `app/(forge)/layout.tsx` que es PADRE.
- **Archivo afectado:**
  - Opción A: `components/forge/layout/ForgeCreditHubAppShell.tsx` — agregar `forge-app` al className del div que setea `data-tenant`
  - Opción B: `app/(forge)/layout.tsx` — propagar `data-tenant` también al `.forge-app` parent
  - Opción C: cambiar selector en `tokens.css` a `[data-tenant="credicefi"] { --forge-brand-500: ... }` (sin scope `.forge-app`) — más permisivo, mayor blast radius
- **Fix propuesto (recomendado):** Opción A — agregar `forge-app` al className del shell. Confirma que `.forge-app[data-tenant="X"]` matchea el mismo elemento. Cambio mínimo (1 className), zero blast radius. Mockup HTML que produje en P10-05 ya seguía este patrón; el agent lo perdió al integrar.
- **Estimación:** 5 min
- **Bloqueador para:** PR a main · smoke test escenarios 2/4 (visualización del tenant theming)

### BUG-004 · Hydration mismatch en `ForgeCreditHubAppShell` rompe el subtree · 🟠 BLOQUEADOR
- **Síntoma:** Console muestra error masivo `Hydration failed because the server rendered HTML didn't match the client`. SSR renderiza `<dialog>` (Modal de keyboard shortcuts del CommandPalette, `open={false}`) en cierto slot; client renderiza `<section aria-label="Notifications alt+T">` (Sonner Toaster) en el mismo slot. React detecta mismatch → re-genera el subtree completo → posibles efectos secundarios sobre el `data-tenant` attribute, CSS vars, banner mount, etc.
- **Causa raíz:** Orden de mounting de `ForgeToaster` vs `ForgeCommandPaletteProvider` no es deterministic SSR↔client. Probablemente el `<dialog>` del Modal usa portal (`createPortal`) o conditional rendering basado en window/document que difiere SSR.
- **Archivo afectado:** `components/forge/layout/ForgeCreditHubAppShell.tsx` (orden de mounting de los providers); posiblemente `components/forge/ui/Modal.tsx` y/o `components/forge/ui/Toast.tsx` (uso de `<dialog>` o portals)
- **Fix propuesto:**
  - Investigar si `<dialog>` del Modal usa `<dialog>` HTML element nativo (que tiene comportamiento SSR especial)
  - Mover `<ForgeToaster />` fuera del `<CHTenantGuard>` o usar `next/dynamic` con `ssr: false` para `Modal` cuando `open={false}`
  - O wrap del shell entero en `'use client'` boundary que evite SSR del subtree problematico
- **Nota:** Este bug **NO fue introducido por P10-05**. El subtree afectado existía pre-P10-05. Pero P10-05 lo expone porque ahora el shell tiene state-driven rendering (data-tenant condicional, banner condicional, CSS vars condicionales) que amplifica el costo del hydration error. Fix puede deferirse si scope strict.
- **Estimación:** 1-2 hrs investigación + fix
- **Bloqueador para:** depende — el chrome funciona "lo suficiente" después del re-render forzado, pero introduce flicker visual y warnings de console permanentes

### FLAG-001 · Backend devuelve color genérico para Credicefi · 🟡 INFORMATIVO (no del frontend)
- **Síntoma:** `GET http://localhost:8010/api/v2/tenants/credicefi/branding` devuelve `brand_primary: "#2E5F97"` y `brand_dark: "#1A2540"`.
- **Esperado per `tokens.css` línea 237-241:** `brand_primary: "#1b4a8c"`, `brand_dark: "#081e3d"` (Credicefi navy real).
- **Implicación:** Aunque BUG-001/002/003 se arreglen y el frontend logre fetch + apply, los colores aplicados serían los defaults Forge (`#2E5F97`), NO los Credicefi (`#1B4A8C`). El usuario VERÁ branding "exitoso" pero VISUALMENTE idéntico al default — falso positivo de éxito.
- **Causa probable:** Los seed data del backend tienen colors default Forge en lugar de los hex reales por tenant. Tabla `tenant_branding` requiere update.
- **Acción:** **NO es del scope frontend / Cowork.** Reportar a Ramon para corrección del seed/migration de `tenant_branding`. Mientras tanto, smoke test puede usar `banco-piloto-rd` (verde corporativo) para verificar visual switch real, asumiendo que ese tenant tenga el verde correcto en BD.

---

## Recomendación final

**❌ NO listo para PR a main.** Bloqueadores:
- BUG-001 (UUID vs slug) — fundamental, sin esto el endpoint nunca devolverá 200
- BUG-002 (env var name) — el cliente nunca arranca el fetch
- BUG-003 (CSS scope mismatch) — aunque fetch devuelva 200, los colores no se aplican

**Fixes prioritarios para volver a smoke test (orden sugerido):**

1. **BUG-002** primero (5 min) — desbloquea el fetch para que llegue al backend
2. **BUG-001** segundo (30 min) — desbloquea que el backend responda 200
3. **BUG-003** tercero (5 min) — desbloquea que el branding aplicado sea visible
4. **Re-run Fase 1** (10 min) para confirmar que el flow funciona
5. **Continuar con Fase 2** (5 escenarios) y **Fase 3** (button-by-button)
6. **BUG-004** (hydration) — diferible si scope strict; documentar como deuda en P10-11 si Cesar lo prefiere
7. **FLAG-001** — escalar a Ramon para corrección de seed data en backend

**Tiempo total estimado para PR-ready:** ~1.5 hrs (fixes + re-test fase 1 + fases 2+3).

**Si Cesar autoriza:** puedo arrancar con los fixes BUG-001/002/003 ahora mismo (1-2 archivos cada uno, cambios pequeños). Ya con el diagnóstico hecho, los fixes son mecánicos.

---

*Fin del reporte parcial. Esperando decisión de Cesar sobre cómo proceder.*
