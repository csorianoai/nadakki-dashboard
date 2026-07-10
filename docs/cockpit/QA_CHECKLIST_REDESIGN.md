# QA Checklist — Cockpit UI Redesign v1.1

**Date:** 2026-07-10  
**Worker:** Cursor (autonomous loop)  
**Base:** `main` after PRs #290–#293

---

## Build & tests

| Check | Result |
|-------|--------|
| `npm run build:webpack` | PASS (Next.js 16.2.4) |
| `npx jest tests/cockpit` | PASS (6/6) |
| Routes registered | `/cockpit`, `/cockpit/credit`, `/cockpit/tenants`, `/cockpit/users`, `/cockpit/plans` |

---

## Visual fidelity (manual — capture in staging)

| Nivel | Ruta | Prototipo ref | Estado |
|-------|------|---------------|--------|
| F1 Shell | `/cockpit` | Dark sidebar + topbar + Inter/JetBrains | READY_FOR_QA |
| F2 Red | `/cockpit` | 5 health cards + 6 core cards + sparklines | READY_FOR_QA |
| F3 Credit | `/cockpit/credit` | 9 KPIs + 3 charts + queue + AML | READY_FOR_QA |
| F4 Tenants | `/cockpit/tenants` | Tabla + wizard 3 pasos | READY_FOR_QA |
| F4 Users | `/cockpit/users` | Tabla + reset token modal | READY_FOR_QA |
| F4 Plans | `/cockpit/plans` | Plan cards + usage (superadmin) | READY_FOR_QA |

**Screenshots:** Pendientes en entorno con sesión `platform_superadmin` / `tenant_admin`. Adjuntar en PR review.

---

## Zero false greens

| Panel | Endpoint | Helper | Live / DEMO |
|-------|----------|--------|-------------|
| Network health | `GET /observability/v1/network/health` | `platformFetch` | DEMO si 404/501/`data_source:none` |
| Cores (6 siempre) | `GET /observability/v1/cores/summary` | `platformFetch` + `mergeToSixCores` | DEMO por core sin registry |
| Activity | `GET /observability/v1/activity?limit=10` | `platformFetch` | DEMO badge en panel |
| Alerts | `GET /observability/v1/alerts?status=open` | `platformFetch` | Vacío OK |
| Credit KPIs/charts | `GET /credit-hub/v1/dashboard` | `platformFetch` | DEMO en `demo-credit` |
| Queue | `GET /credit-hub/v1/requests?scope=network` | `platformFetch` | DEMO |
| AML | `GET /credit-hub/v1/compliance/aml` | `platformFetch` | DEMO |
| Tenants | `GET /tenant-admin/v1/tenants` | `platformFetch` | DEMO badge |
| Users | `GET /auth-users/v1/users` | `platformFetch` | Vacío si error |
| Plans/usage | `GET /tenant-admin/v1/plans`, `/observability/v1/usage` | `platformFetch` | DEMO usage |

---

## Aislamiento de theme

| Ruta fuera cockpit | Verificación |
|--------------------|--------------|
| `/credit-hub/dealer` | `AppGate` no aplica `GlobalForgeAppShell` a `/cockpit` solamente; Credit Hub conserva shell Forge |
| `/legal`, `/marketing` | Sin clases `cockpit-*` ni fuentes Inter scoped |

**Evidencia:** Comparar screenshot Credit Hub dealer antes/después del merge de F1.

---

## Entry point & redirect

| Item | Esperado |
|------|----------|
| User menu global | "Consola de Plataforma" → `/cockpit`, solo `platform_superadmin` \| `tenant_admin` |
| Legacy | `/credit-hub/admin` → redirect `/cockpit` |
| Legacy credit | `/credit-hub/admin/credit` → `/cockpit/credit` |
| Legacy platform | `/credit-hub/admin/platform` → `/cockpit/tenants` |
| Portal tile Admin | Removido de `/credit-hub` home |

---

## Auth

| Código | Comportamiento |
|--------|----------------|
| 401 | `ProtectedRoute` → login |
| 403 | `CHAdminAccessGuard` mensaje + sin children |
| `tenant_admin` | Sin "Suscripciones y Planes"; tenant fijado en topbar |

---

## Backend discrepancies handled

- Cores keyed por `code` (`core-registry.ts`, `normalize.ts`)
- `tenants.status` → `normalizeStatus()` lowercase
- Wizard usa `plan_id` FK; columna legacy `plan` ignorada en UI
- Branding JSON: `display_name`, `logo_url`, `brand_primary` (API field; UI label "color primario")

---

## DEFERRED

- Screenshots comparativos vs prototipo HTML (requiere deploy preview + rol QA)
- `GET /credit-hub/v1/audit` spec vs implementación `audit-trail` — fetcher existente conservado
- Conteo usuarios en badge sidebar — endpoint agregado no expuesto; badge tenants sí
- Eliminar `lib/cockpit/nivel*` y `AdminNetworkOsView` — código legacy aún presente, rutas ya no lo usan

---

## Merge order (César)

1. `cockpit-ui/r1-shell-theme-route`
2. `cockpit-ui/r2-nivel1-fidelity` (rebase on r1 squash)
3. `cockpit-ui/r3-nivel2-fidelity`
4. `cockpit-ui/r4-nivel3-fidelity`
5. `cockpit-ui/r5-entrypoint-cleanup`

No mergear en este loop (GR-11).
