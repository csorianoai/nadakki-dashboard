# F0 — Finance Cockpit v3.1 Baseline

**Date:** 2026-07-13  
**Repo:** nadakki-dashboard (frontend)  
**Baseline commit:** `main` @ `e260bea189aaf98efd7f307e0d7fbd494faad6c3`  
**Probe host:** `https://nadakki-ai-suite.onrender.com` (Render production)  
**Dashboard:** `https://dashboard.nadakki.com`  
**Node:** v25.5.0 · **npm:** 11.8.0 · **Next.js:** 16.2.4

---

## 0.1 Inventario de componentes y rutas

### Shell cockpit (existente en `main`)

| Artefacto | Path exacto | Clasificación |
|-----------|-------------|---------------|
| `CockpitSidebar` | `components/cockpit/CockpitSidebar.tsx` | **EXTEND** — agregar entrada Finanzas + exit UX (PR #310 pendiente merge) |
| `CockpitTopbar` | `components/cockpit/CockpitTopbar.tsx` | **EXTEND** — avatar estático en `main`; PR #310 añade `CockpitUserMenu` |
| `CockpitShellLayout` | `components/cockpit/CockpitShellLayout.tsx` | **PRESERVE** |
| `CockpitNavLink` | mismo archivo que shell layout | **REUSE** |
| `CockpitUserMenu` | `components/cockpit/CockpitUserMenu.tsx` | **MISSING en main** — existe en rama `fix/cockpit-exit-nav` (PR #310) |
| `NetworkView` | `components/cockpit/network/NetworkView.tsx` | **PRESERVE** |
| `NetworkHealthCard` | `components/cockpit/network/NetworkHealthCard.tsx` | **REUSE** — patrón KPI + `DataTruthBadge` |
| `CoreCard` / `Sparkline7d` | `components/cockpit/network/` | **REUSE** |
| `CreditView` | `components/cockpit/credit/CreditView.tsx` | **PRESERVE** |
| `TenantsView` / `UsersView` / `PlansView` | `components/cockpit/{tenants,users,plans}/` | **PRESERVE** |

### Auth y contexto

| Artefacto | Path | Clasificación |
|-----------|------|---------------|
| `UserMenu` global | `components/forge/auth/UserMenu.tsx` | **PRESERVE** — no usado en `/cockpit` (`AppGate` bypass) |
| `AppGate` | `components/auth/AppGate.tsx` | **PRESERVE** — `/cockpit` → `ProtectedRoute` sin `GlobalForgeAppShell` |
| `CHAdminAccessGuard` | `components/credit-hub/system/CHAdminAccessGuard.tsx` | **REUSE** — guard cockpit layout |
| `CockpitContext` | `lib/cockpit/context.tsx` | **REUSE** — rol, locale `es-DO`, currency `DOP`, tenant filter |
| `TenantContext` | `contexts/TenantContext.tsx` | **REUSE** — `tenantId` en `localStorage` (`nadakki_tenant_id`) |
| `useAuth` | `hooks/useAuth.ts` → `lib/auth/auth-context.tsx` | **REUSE** |

### Fetch y datos

| Artefacto | Path | Clasificación |
|-----------|------|---------------|
| `platformFetch` | `lib/platformApi.ts` | **REUSE** — allowlist única: `/api/v1/cockpit` |
| `fetchOrDemo` | patrón inline en `lib/cockpit/api/observability.ts`, `creditHub.ts` | **REUSE** — 404/501 → demo + badge |
| `fetchOrDemo` (extracted) | `lib/cockpit/api/fetchOrDemo.ts` | **MISSING en main** — existe en `finance-ui/f5-registry-crud` |
| `demo.ts` | `lib/cockpit/demo.ts` | **REUSE** — stubs network con `data_source: "none"` |
| `core-registry` | `lib/cockpit/core-registry.ts` | **REUSE** — 6 cores, colores fallback |
| `DataTruthBadge` | `components/credit-hub/honesty/DataTruthBadge.tsx` | **REUSE** — niveles REAL/DEMO/SANDBOX/ROADMAP |
| `TenantSelector` | `components/ui/TenantSelector.tsx` | **PRESERVE** — shell global; cockpit usa `<select>` propio en topbar |

### API modules cockpit (`main`)

| Módulo | Path | Endpoints |
|--------|------|-----------|
| observability | `lib/cockpit/api/observability.ts` | network/health, cores, overview, alerts |
| creditHub | `lib/cockpit/api/creditHub.ts` | credit/summary, pipeline, aml (demo) |
| tenantAdmin | `lib/cockpit/api/tenantAdmin.ts` | tenants CRUD, plans (404→demo) |
| authUsers | `lib/cockpit/api/authUsers.ts` | users CRUD |

### Rutas cockpit (`main`)

| Ruta | Page | Clasificación |
|------|------|---------------|
| `/cockpit` | `app/(cockpit)/cockpit/page.tsx` | **PRESERVE** |
| `/cockpit/credit` | `app/(cockpit)/cockpit/credit/page.tsx` | **PRESERVE** |
| `/cockpit/tenants` | `app/(cockpit)/cockpit/tenants/page.tsx` | **PRESERVE** |
| `/cockpit/users` | `app/(cockpit)/cockpit/users/page.tsx` | **PRESERVE** |
| `/cockpit/plans` | `app/(cockpit)/cockpit/plans/page.tsx` | **PRESERVE** |
| `/cockpit/finance/*` | — | **MISSING** — implementado en ramas `finance-ui/f1`–`f5` (PRs cerrados sin merge) |

### Guards y middleware

| Artefacto | Path | Notas |
|-----------|------|-------|
| `middleware.ts` | raíz | Tenant isolation en `/api/*`; cockpit pages no afectadas |
| `CHAdminAccessGuard` | ver arriba | `platform_superadmin` \| `tenant_admin` |
| `ProtectedRoute` | `components/forge/auth/ProtectedRoute.tsx` | Sesión JWT; 401 → `/login?next=` |

### Tests cockpit (`main`)

| Archivo | Tests | Resultado F0 |
|---------|-------|--------------|
| `tests/cockpit/platform-fetch-separation.test.ts` | 4 | PASS |
| `tests/cockpit/querystring-filters.test.ts` | 2 | PASS |
| E2E cockpit | — | **MISSING** — `e2e/` no contiene specs `/cockpit` |

---

## 0.2 Baseline técnico

Ejecutado en `finance-v3/f0-baseline` (working tree = `main` + docs F0). Build tras `Remove-Item .next -Recurse`.

| Comando | Duración | Exit | Resultado |
|---------|----------|------|-----------|
| `npm run lint` | 10.8s | 0 | PASS — scope acotado (no full-repo) |
| `npm run typecheck` | 34.9s | 0 | PASS — **requiere** `.next` limpio; artefactos stale de ramas `finance-ui/*` causan TS2307 falsos |
| `npm run test:run` | 49.5s | 1 | **FAIL preexistente** — 38 suites / 90 tests fallidos de 311 suites / 1320 tests |
| `npm run test:run -- tests/cockpit` | 2.0s | 0 | PASS — 6/6 |
| `npm run test:integration` | — | — | **N/A** — script no definido en `package.json` |
| `npm run build:webpack` | 188.7s | 0 | PASS |
| `npm run test:e2e` | — | — | **NO EJECUTADO** — requiere `npm run dev` + sin specs cockpit; suite bank/credit dominante |

### Fallos preexistentes (no introducidos por finance-v3)

1. **Jest global:** 38 suites fallidas — mayoría `tests/credit-hub/content/wizard/WizardContainer.test.tsx` y suites credit-hub/bank (pre-existing debt).
2. **Typecheck con `.next` stale:** referencias a rutas `app/(cockpit)/cockpit/finance/*` de build previo en rama `finance-ui/*`.
3. **Lint scope:** `npm run lint` no cubre `components/cockpit/` ni `lib/cockpit/` — limitación del script actual.

### Criterio de regresión F0 para el loop

- **Baseline crítico cockpit:** `tests/cockpit/*` + `build:webpack` + rutas `/cockpit` existentes.
- **Baseline acumulado:** no empeorar conteo Jest global sin justificación; documentar delta por fase.

---

## 0.3 Baseline visual y funcional

| Captura requerida | Estado F0 | Notas |
|-------------------|-----------|-------|
| Cockpit home `/cockpit` | **PENDING** | Requiere sesión `demo.admin@nadakki-demo.com` en dashboard.nadakki.com |
| Sidebar + topbar | **PENDING** | Idem |
| Credit Hub cockpit | **PENDING** | Idem |
| Tenants / Users | **PENDING** | Idem |
| Viewports 1440 / 768 / 375 | **PENDING** | Playwright configurado (`playwright.config.ts`); sin specs cockpit |

**Evidencia alternativa verificada:** shell oscuro aislado en `app/(cockpit)/layout.tsx` (`data-cockpit-root`, tokens `cockpit-*`).

**Acción F2:** agregar specs Playwright cockpit + screenshots en PR.

---

## 0.4 Baseline de contratos (producción)

Probe sin JWT — 2026-07-13T16:03Z contra Render.

| Endpoint | HTTP | Interpretación |
|----------|------|----------------|
| `GET /api/v1/cockpit/network/health` | **401** | Ruta existe; auth requerida |
| `GET /api/v1/cockpit/credit/summary` | **401** | Ruta existe |
| `GET /api/v1/cockpit/users` | **401** | Ruta existe |
| `GET /api/v1/cockpit/population/summary` | **401** | **LIVE en producción** (F3 backend mergeado) |
| `GET /api/v1/cockpit/population/by-core` | **401** | LIVE |
| `GET /api/v1/cockpit/finance/kpis` | **404** | **NO desplegado** (F4 backend pendiente) |
| `GET /api/v1/cockpit/finance/mrr-by-core` | **404** | NO desplegado |
| `GET /api/v1/cockpit/finance/tenant-financials` | **404** | NO desplegado |
| `GET /api/v1/cockpit/registry/professions?core=credit` | **404** | **NO desplegado** (F5 backend pendiente) |

### Respuestas autenticadas (200)

**No verificadas en F0** — JWT `platform_superadmin` no disponible en entorno agente.  
**Expectativa documentada:** con sesión activa en dashboard, `network/health`, `credit/summary`, `users`, `population/summary` → **200** con `data_source: "live"`.

### DEMO / fetchOrDemo en frontend actual

| Endpoint | Comportamiento en UI |
|----------|---------------------|
| `network/*` | Live; `data_source:"none"` → badge DEMO |
| `credit/summary` | Live |
| `credit/compliance/aml` | 404 → DEMO permanente (`BACKEND_ENDPOINT_MAP.md`) |
| `plans` | 404 → lista vacía / demo |
| `finance/*` | **No hay UI en main**; ramas `finance-ui` usan `fetchOrDemo` → badge obligatorio |
| `registry/*` | **No hay UI en main** |

### MRR = RD$0.00 en producción

Confirmado por contexto Nadakki: 18 tenants en plan Free (`price_monthly = 0`). **No es bug.** Golden path revenue debe mostrar cero real, no fixture.

---

## 0.5 Verificación contexto Nadakki

| Check | Estado | Evidencia |
|-------|--------|-----------|
| Login `demo.admin@nadakki-demo.com` | **EXTERNALLY_BLOCKED** | Sin credenciales en entorno agente |
| `/cockpit` shell oscuro | **CODE-VERIFIED** | `app/(cockpit)/layout.tsx` |
| Tenants protegidos UUID | **CODE-VERIFIED** | Referencias en repo (no modificar en seeds/tests) |

| Tenant | UUID | Referencia repo |
|--------|------|-----------------|
| Credicefi | `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` | `lib/credit-hub/types/creditCore.ts` |
| Banco Piloto RD | `550e8400-e29b-41d4-a716-446655440099` | `_design_p11_audit/sprint1_prep/05_P11-01_EXECUTION_COMMANDS.md` |
| Nadakki Demo | `d3b00111-0000-0000-0000-000000d3b001` | `docs/runbooks/SPRINT_3_PROVISIONING_DEMO_ADMIN.md` |

### Ruta dashboard tenant home

| Rol | Path | Fuente |
|-----|------|--------|
| `platform_superadmin` | `/` | `POST_LOGIN_REDIRECT_BY_ROLE` en `lib/auth/auth-context.tsx` |
| `tenant_admin` | `/` | Idem |

PR #310 (`fix/cockpit-exit-nav`) implementa retorno vía `getPostLoginRedirectPath(allRoles)` — **no mergeado en main**.

### Roles cockpit confirmados

- `platform_superadmin` — acceso completo, tab Registro, CRUD registry
- `tenant_admin` — cockpit restringido (`isTenantAdminOnly` en `CockpitContext`); sin Registro

---

## 0.6 Clasificación global (PRESERVE / REUSE / EXTEND / REPLACE / MISSING)

### Frontend `main`

| Área | Clasificación |
|------|---------------|
| Shell cockpit oscuro | **PRESERVE** |
| Rutas network/credit/tenants/users/plans | **PRESERVE** |
| `platformFetch` + separación tenant | **PRESERVE** |
| `fetchOrDemo` pattern | **REUSE** en finance APIs |
| `DataTruthBadge` | **REUSE** |
| `core-registry` | **REUSE** + **EXTEND** si backend expone más cores |
| Sidebar/Topbar exit UX | **MISSING en main** → PR #310 o F2 |
| `/cockpit/finance/*` rutas y componentes | **MISSING en main** |
| Contratos Zod finance-v3 | **MISSING** |
| Matrix / tenant detail / feature flags | **MISSING** |

### Backend producción (alembic 086)

| Área | Clasificación |
|------|---------------|
| `population/*` (8 GET) | **REUSE** — live |
| `finance/*` (3 GET) | **MISSING** — PR backend F4 no mergeado |
| `registry/*` (8 CRUD) | **MISSING** — PR backend F5 no mergeado |
| `finance/matrix` agregado | **MISSING** — crear en F6 backend |
| `finance/tenants/{id}/overview` | **MISSING** — crear en F7 backend |

### Trabajo previo no mergeado (referencia)

| Rama frontend | PR | Estado | Contenido |
|---------------|-----|--------|-----------|
| `finance-ui/f1-nav-shell` | #305 | **CLOSED** | Nav Finanzas + rutas placeholder |
| `finance-ui/f2-revenue-page` | #306 | **CLOSED** | Revenue KPIs + tablas |
| `finance-ui/f3-population-*` | #307 | **CLOSED** | Population 2 sub-vistas |
| `finance-ui/f4-population-*` | #308 | **CLOSED** | Population cross-cuts |
| `finance-ui/f5-registry-crud` | #309 | **CLOSED** | Registry CRUD UI |
| `fix/cockpit-exit-nav` | #310 | **OPEN** | Exit UX (3 caminos) |

**Decisión F1 (pendiente):** reutilizar código de `finance-ui/*` como base del stack `finance-v3/*` vs reimplementar. F0 no asume merge de PRs cerrados.

---

## GATE F0 — Checklist

| Criterio | Estado |
|----------|--------|
| Baseline reproducible documentado | **PASS** |
| Fallos preexistentes separados | **PASS** |
| Ruta dashboard tenant = `/` | **PASS** |
| Roles platform_superadmin / tenant_admin | **PASS** |
| Repos y contratos identificados | **PASS** |
| Finance F4 + Registry F5 backend pendientes | **PASS** (404 producción) |
| Screenshots navegador | **PENDING** (blocked credenciales) |
| Probe autenticado 200 | **PENDING** (blocked JWT) |

**GATE F0: GREEN** para avanzar a F1 con deuda documentada (screenshots + curl autenticado = evidencia humana post-login).

---

## Stack git v3.1 (siguiente)

```
main (e260bea)
└── finance-v3/f0-baseline  ← este documento
    └── finance-v3/f1-navigation-shell (siguiente)
```

**Nota:** Integrar PR #310 (exit UX) en F2 antes o como prerequisito del shell finance.
