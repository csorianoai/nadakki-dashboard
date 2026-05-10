# Smoke Test P10-05 — Live tenant_branding fetch

**Generated:** 2026-05-10
**Branch:** `feat/forge-cowork-2026-05-09-pivot`
**Commit base:** `c83fd35`
**Tester:** _________________
**Date executed:** _________________

---

## Pre-requisitos

- [ ] Backend uvicorn corriendo en `:8010` (o el puerto configurado en tu `.env.local`)
- [ ] Endpoint `GET /api/v2/tenants/credicefi/branding` responde 200 con shape correcto:
  ```json
  {
    "tenant_id": "credicefi",
    "display_name": "Credicefi",
    "logo_url": "...",
    "brand_primary": "#1B4A8C",
    "brand_dark": "#081E3D",
    "locale": "es-DO",
    "currency": "DOP",
    "regulatory_profile": "INDOTEL",
    "application_status_labels": { ... },
    "copy_overrides": { ... }
  }
  ```
- [ ] `npm run dev` en `:3000` levantado
- [ ] DevTools abierto: tabs **Console**, **Network**, **Elements**
- [ ] `.env.local` contiene **`NEXT_PUBLIC_API_BASE_URL`** apuntando al backend
  > ⚠️ **OJO:** ver "Issue conocido — Tarea 1 §b" en este mismo archivo. La mayoría de clientes en el repo usan `NEXT_PUBLIC_API_URL`. El cliente de tenant-branding usa `NEXT_PUBLIC_API_BASE_URL`. Asegúrate de que ambas vars apunten al mismo URL si tu setup actual solo define una.

---

## Escenario 1 — Soft deprecation warning (1 vez por sesión)

**URL:** `http://localhost:3000/credit-hub/dealer`

**Expected:**
- Console muestra **UN solo** warn `"useTenantConfig is deprecated. Migrate to useTenantBranding for chrome fields (P10-05), or to useTenantBankingPolicy for banking policy (P10-09 pending)."`
- El warning aparece UNA vez aunque navegues entre páginas (`useTenantConfig` se llama desde una sola línea, frame [3] es siempre la misma → fingerprint único)

**Action:**
1. Limpiar console (`Ctrl+L` en DevTools)
2. Navegar: `dealer` → `dealer/applications` → `bank` → `bank/applications`
3. Contar cuántos warns "useTenantConfig is deprecated" aparecen

**Result:** [ ] PASS / [ ] FAIL

**Notes:** _________________

---

## Escenario 2 — Branding success (200 OK)

**URL:** `http://localhost:3000/credit-hub/dealer`

**Expected:**
- **Network tab:** `GET /api/v2/tenants/credicefi/branding` → `200 OK` (un solo request, cacheado por react-query 5min después)
- **Sidebar header:** background `#081E3D` (Credicefi navy oscuro = `--forge-brand-900`), texto blanco
- **Topbar:** muestra `display_name` ("Credicefi") y logo (si `logo_url` no null)
- **Elements tab:** `<div class="forge-app" data-tenant="credicefi" style="--forge-brand-500: #1B4A8C; --forge-brand-900: #081E3D">`
- **Console:** sin errores, sin banner rojo en pantalla
- **Currency formatters:** valores monetarios en pages dealer/bank usan `RD$` con locale `es-DO` (ej. `RD$1,847,500`)

**Action:**
1. Hard refresh (Ctrl+Shift+R)
2. Verificar Network → 1 request a `/branding`
3. Inspeccionar `<div class="forge-app">` en Elements → confirmar `data-tenant` + `style` con CSS vars
4. Verificar visualmente sidebar header dark navy

**Result:** [ ] PASS / [ ] FAIL

**Notes:** _________________

---

## Escenario 3 — Branding error 404/500 → fallback + banner persistente

**Setup:** Modificar temporalmente para forzar error. Opciones:
- (a) Backend down: parar uvicorn y refresh — esperamos NetworkError
- (b) Tenant inexistente: editar `useTenant()` localmente para retornar `tenantId = "ghost-tenant-xyz"` — esperamos 404 → `TenantBrandingNotFoundError`
- (c) DevTools Network → throttle "Offline" + refresh — esperamos NetworkError

**Expected:**
- **Banner rojo persistente** entre topbar y main content (NO toast, NO modal):
  - Background `--forge-danger-50` (rosa muy pálido)
  - Border-left `--forge-danger-500` (rojo institucional, 3px)
  - Icono `AlertTriangle` de lucide-react (5x5, color danger-500)
  - Texto principal según error class:
    - 404: `"Institution configuration not found. Contact admin."`
    - 403: `"Access denied to this institution. Verify your session."`
    - 5xx/network: `"Could not load institution branding. Using default theme."`
  - Texto secundario: `"Reference: ERR-<timestamp>-<rand4>"` en font mono
  - Botón **`Retry`** outline danger
- **App sigue navegable** — sidebar nav, topbar, content, NO crashea
- **Sidebar/topbar usan defaults Forge** — `--forge-brand-500: #2e5f97` (navy genérico), `display_name: "Forge Credit Hub"` (o equivalente del fallback)
- **Currency formatters** caen a `RD$` con `es-DO` (default DO)
- **Reference ID** se mantiene estable mientras el banner está montado (no cambia entre renders)

**Action:**
1. Aplicar setup (a, b, o c)
2. Refresh
3. Confirmar banner aparece, app sigue funcional
4. Click "Retry" → confirmar que dispara nuevo request (Network tab)

**Result:** [ ] PASS / [ ] FAIL

**Notes:** _________________

---

## Escenario 4 — Tenant switch a `banco-piloto`

**Setup:** Cambiar `tenantId` a `"banco-piloto"`. Opciones:
- (a) Login con un usuario asignado a banco-piloto (si auth real disponible)
- (b) Forzar override en `useTenant()` localmente para retornar `tenantId = "banco-piloto"`
- (c) Modificar `localStorage.nadakki_tenant_id` en DevTools y refresh

**Expected:**
- **Network:** `GET /api/v2/tenants/banco-piloto/branding` → 200
- **Sidebar header:** background `#0b5345` → `#032620` (verde oscuro corporativo, definido en `tokens.css` línea 244-247)
- **Elements:** `<div class="forge-app" data-tenant="banco-piloto" style="--forge-brand-500: #0b5345; --forge-brand-900: #032620">`
- **Topbar:** muestra "Banco Piloto RD" (o el `display_name` que el backend retorne)
- **Locale + currency:** mantiene `es-DO` y `RD$` (Banco Piloto es DR también)
- **Sin banner rojo** — fetch exitoso

**Action:**
1. Aplicar setup
2. Hard refresh
3. Confirmar verde corporativo en sidebar
4. Verificar `data-tenant="banco-piloto"` en Elements

**Result:** [ ] PASS / [ ] FAIL

**Notes:** _________________

> **Si tuvieras tenant MX activo (`NEXT_PUBLIC_FORGE_TEST_TENANT=mx`):**
> - locale debería cambiar a `es-MX`
> - currency a `MXN` formateado con `MX$`
> - Sidebar header rojo oscuro (`#3D0A0A` definido en `tokens.css` línea 217)
> - data-tenant="test-mx-tenant-uuid"

---

## Escenario 5 — Reduced motion (a11y gate)

**Setup:**
1. DevTools → Three-dot menu → **More tools** → **Rendering**
2. Sección "Emulate CSS media feature `prefers-reduced-motion`" → seleccionar **`reduce`**

**Expected:**
- **Skeleton del topbar/sidebar** (estado loading antes de que el fetch responda) aparece **estático**, sin shimmer animation
- Estructura visual del skeleton sigue visible (gris claro), pero **sin pulse/movimiento**
- Resto de transiciones del Forge (hover de buttons, focus rings) también respetan `prefers-reduced-motion: reduce` (esto es comportamiento global de tokens.css línea 249-256)

**Action:**
1. Activar `reduce` motion
2. Hard refresh `/credit-hub/dealer`
3. Si el fetch es muy rápido para ver el skeleton: throttle Network a "Slow 3G" + refresh
4. Verificar que los skeletons NO tienen pulse animation

**Result:** [ ] PASS / [ ] FAIL

**Notes:** _________________

---

## Resumen

**Escenarios PASS:** ___ / 5

**Bloqueadores encontrados:** _________________

**Issues no-bloqueantes encontrados:** _________________

**Decisión:**
- [ ] Listo para PR a `main`
- [ ] Necesita correcciones — ver lista de bloqueadores arriba

---

## Apéndice — Issues conocidos a verificar primero

### Issue 1 — Env var name inconsistency

El cliente `tenant-branding-client.ts` usa `NEXT_PUBLIC_API_BASE_URL` (matching `_API_CONTRACT.md`), pero el resto del repo (credit-api, spyfu, document-intelligence, autopilot, scheduler-status, legal/telemetry, public-consent-client) usa `NEXT_PUBLIC_API_URL`.

Si tu `.env.local` solo tiene `NEXT_PUBLIC_API_URL`, el cliente P10-05 lanzará `TenantBrandingNetworkError("NEXT_PUBLIC_API_BASE_URL is not defined")` en CADA fetch, incluso con backend funcionando — y verás el banner rojo del Escenario 3 en TODAS las pantallas (falso positivo).

**Workaround para el smoke test:** agregar **ambas** vars al `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8010
NEXT_PUBLIC_API_BASE_URL=http://localhost:8010
```

**Fix de fondo (futura tarea):** cambiar el cliente a `process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL` — fallback chain. O alinear `_API_CONTRACT.md` para que use `NEXT_PUBLIC_API_URL` igual que el resto del repo.

### Issue 2 — `useSelectedLayoutSegments` para persona

El AppShell sigue derivando persona desde URL segments (B4 deuda documentada, P10-04). Si el smoke test muestra persona incorrecto en algún escenario, **NO es regresión de P10-05**. Es la deuda existente que P10-04 cierra.

### Issue 3 — Banking policy sigue default

Si entras al wizard dealer y ves que pide CEDULA (default DO) aunque el tenant sea `banco-piloto-mx-hipotético`, **NO es regresión de P10-05**. Es el "75% restante del teatro" que P10-09 cierra.

---

*Fin del smoke test. Reportar resultados a Cesar via chat al terminar los 5 escenarios.*
