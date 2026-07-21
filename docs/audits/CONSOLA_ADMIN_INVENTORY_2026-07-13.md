# Inventario de Consolas Administrativas Nadakki

**Fecha:** 2026-07-13T16:30:00-04:00  
**Ejecutado por:** Cursor (read-only)  
**Rol observado:** `platform_superadmin` (referencia: `demo.admin@nadakki-demo.com`)  
**Repo:** `nadakki-dashboard` @ rama local `finance-v3/f1-navigation-shell` (código inspeccionado, sin commits de esta auditoría)  
**Método:** inventario de rutas `app/`, sidebars, guards, fetch patterns, tests, `git log` por archivo clave.

---

## Resumen ejecutivo

Nadakki tiene **3 superficies administrativas distintas** más **2 artefactos relacionados** (`/dashboard` agentes y redirect legacy `/credit-hub/admin`). El **solapamiento funcional es alto** en tenants, usuarios, planes/billing, salud del sistema y agentes — pero con **fuentes de datos diferentes** (mock/hardcoded en Consola A vs `platformFetch` live en Consola B). La Consola C (`/`) es landing de descubrimiento, no consola operativa. **Recomendación:** Estrategia 3 (cohabitación con roles diferenciados), priorizando **Cockpit como consola analítica/plataforma** y **Panel admin como consola operacional tenant-scoped**, con migración gradual de duplicados y retiro documentado de mocks en `/tenants`.

---

## Mapa de ubicaciones (Paso 1)

| ID | Nombre | Path layout / rutas | Shell | Estado |
|----|--------|---------------------|-------|--------|
| **A** | Panel admin dashboard tenant | `app/admin/**`, `app/tenants/**`, `app/dashboard/**` | `GlobalForgeAppShell` vía `AppGate` | **Activa** — sidebar sección "Administración" |
| **B** | Network Cockpit | `app/(cockpit)/cockpit/**` | Shell aislado oscuro (`app/(cockpit)/layout.tsx`) | **Activa** — bypass `GlobalForgeAppShell` |
| **C** | Landing NADAKKI AI Suite | `app/page.tsx` → `/` | `GlobalForgeAppShell` (contenido oscuro `ndk-page`) | **Activa** — post-login home |
| — | Dashboard agentes (relacionado) | `app/dashboard/page.tsx` → `/dashboard` | GlobalForge | **Activa** — sub-item admin sidebar |
| — | Credit Hub admin (legacy) | `app/(forge)/credit-hub/admin/page.tsx` | Redirect | **Deprecated** → `redirect("/cockpit")` |
| — | Sidebar legacy | `components/layout/Sidebar.tsx` | — | **No referenciado** (0 imports en repo activo) |

**No existe** `app/(forge)/dashboard/` ni `app/nadakki-demo/` como consola admin. El tenant demo se referencia por UUID en docs/runbooks, no como ruta dedicada.

---

## Consola A — Panel admin del dashboard tenant

### Path del layout

- **Sin layout dedicado** en `app/admin/layout.tsx`.
- Rutas bajo `app/admin/*` renderizan dentro de `GlobalForgeAppShell` (`components/forge/layout/GlobalForgeAppShell.tsx` → `ForgeGlobalCoresSidebar` + `ForgeGlobalTopbar`).

### Sidebar file

- **Fuente de verdad:** `components/forge/layout/forge-global-sidebar-nav.ts`
- **Sección:** `id: "admin"`, `label: "Administración"`, `icon: Settings`
- **Render:** `components/forge/layout/ForgeGlobalCoresSidebar.tsx`
- **Visibilidad:** `userCanAccessAdminNav(allRoles)` — `tenant_admin`, `platform_superadmin`, o `support_agent` en core `platform`
- **Filtro superadmin:** items con `superAdminOnly: true` ocultos si no es `platform_superadmin`

### Items del sidebar y rutas (sección PLATAFORMA + CONFIG + AGENTES)

| Item sidebar | href | Page file | superAdminOnly |
|--------------|------|-----------|----------------|
| Panel admin | `/admin` | `app/admin/page.tsx` | no |
| Dashboard | `/dashboard` | `app/dashboard/page.tsx` | no |
| Tenants | `/tenants` | `app/tenants/page.tsx` | no |
| Activación | `/admin/activation` | `app/admin/activation/page.tsx` | no |
| Gates / roles | `/admin/gates` | `app/admin/gates/page.tsx` | no |
| Billing | `/admin/billing` | `app/admin/billing/page.tsx` | no |
| Billing (root) | `/billing` | `app/billing/page.tsx` | no |
| Feature flags | `/feature-flags` | `app/feature-flags/page.tsx` | **sí** |
| Audit logs | `/admin/logs` | `app/admin/logs/page.tsx` | no |
| Auditoría | `/admin/audit` | `app/admin/audit/page.tsx` | no |
| API keys | `/admin/api-keys` | `app/admin/api-keys/page.tsx` | **sí** |
| Uso | `/admin/usage` | `app/admin/usage/page.tsx` | no |
| WhatsApp admin | `/admin/whatsapp` | `app/admin/whatsapp/page.tsx` | no |
| Observability | `/admin/observability/dashboard` | `app/admin/observability/dashboard/page.tsx` | no |
| Audit trail | `/admin/observability/audit-trail` | `app/admin/observability/audit-trail/page.tsx` | no |
| SLA monitoring | `/admin/observability/sla-monitoring` | `app/admin/observability/sla-monitoring/page.tsx` | no |
| Sistema | `/admin/system` | `app/admin/system/page.tsx` | **sí** |
| Config | `/admin/config` | `app/admin/config/page.tsx` | no |
| Branding (admin) | `/admin/branding` | `app/admin/branding/page.tsx` | no |
| Base de datos | `/admin/db` | `app/admin/db/page.tsx` | **sí** |
| QA | `/admin/qa` | `app/admin/qa/page.tsx` | no |
| Integraciones (cuenta) | `/settings/integrations` | `app/settings/integrations/page.tsx` | no |
| Notificaciones | `/settings/notifications` | `app/settings/notifications/page.tsx` | no |
| Branding (cuenta) | `/settings/branding` | `app/settings/branding/page.tsx` | no |
| IA (cuenta) | `/settings/ia` | `app/settings/ia/page.tsx` | no |
| Ajustes | `/settings` | `app/settings/page.tsx` | no |
| Todos (admin) agentes | `/admin/agents` | `app/admin/agents/page.tsx` | no |
| Google Ads agent | `/admin/google-ads-agent` | `app/admin/google-ads-agent/page.tsx` | no |
| Credit agents | `/credit-agents` | `app/credit-agents/page.tsx` | no |
| Marketing agents | `/marketing/agents` | `app/marketing/agents/page.tsx` | no |
| Readiness | `/admin/readiness` | `app/admin/readiness/page.tsx` | no |
| Onboarding | `/admin/onboarding` | `app/admin/onboarding/page.tsx` | no |
| Sales scripts | `/admin/sales-scripts` | `app/admin/sales-scripts/page.tsx` | no |

**Governance (sección aparte, no bajo "Administración"):** `/admin/governance` — `superAdminOnly` en nav (`governance-hub`).

### Endpoints consumidos (muestra verificada en código)

| Ruta admin | Endpoints / patrones |
|------------|---------------------|
| `/admin` (home) | `GET /api/ai-studio/agents`; `GET /api/v1/audit/logs?tenant_id=` vía `apiFetch`; `AutonomousHealthPanel` → `/api/v1/system/autonomous/*` |
| `/admin/billing` | `GET /api/v1/billing/plans`; `GET/PATCH /api/v1/tenants/{id}/billing` |
| `/admin/api-keys` | `GET/POST/DELETE /api/v1/tenants/{id}/api-keys` |
| `/admin/gates` | `GET /api/v1/gates`; `POST /api/v1/gates/{id}/{path}` |
| `/admin/config` | `GET /api/v1/config`; `GET /api/v1/social/status`; `GET/PATCH /api/v1/tenants/{id}/config` |
| `/admin/usage` | `GET /api/v1/tenants/{id}/usage` |
| `/admin/system` | `GET /api/v1/system/info`; `GET /api/v1/db/status` |
| `/admin/db` | `GET /api/v1/db/status` |
| `/admin/audit` | `GET /api/v1/system/audit` vía `apiFetch` |
| `/admin/agents` | `GET /health`; `GET /api/catalog/{core}/agents` |
| `/admin/activation` | `postTenantActivate` → suite ops API (`lib/api/suiteOps`) |
| `/admin/readiness` | `getTenantReadiness`, `getFleetReadiness`, `getOpsOnboardingHealth`, Google Ads readiness APIs |
| `/admin/observability/*` | `fetchObservabilityDashboard`, `fetchObservabilityAuditTrail`, `fetchObservabilitySla` + **useSWR** |
| `/admin/branding` | React Query → tenant branding API |
| `/admin/governance` | hooks `useGovernanceReport`, `useRunGovernance` |
| `/tenants` | `GET /api/ai-studio/agents` (solo para badge); **lista hardcoded** `TENANTS_INITIAL` |
| `/dashboard` | `GET /api/catalog/{core}/agents` (CoreAgentsPanel) |

**Patrón dominante:** `fetch` directo a `/api/v1/*` (tenant-scoped con `X-Tenant-ID`), `apiFetch`, `useSWR`, React Query. **No usa** `platformFetch` ni `fetchOrDemo`.

### Guard de rol

- **Shell global:** `ProtectedRoute` en `AppGate` (JWT requerido).
- **Sección admin sidebar:** `userCanAccessAdminNav` (ver arriba).
- **Items superAdminOnly:** ocultos en UI; páginas individuales pueden no re-validar (ej. `/admin/governance` sí valida `platform_superadmin` en página).
- **Sin guard unificado** por ruta `/admin/*` — depende de sidebar + checks locales.

### Tema visual

- **Shell Forge:** claro (`forge-tokens-v2`, sidebar claro).
- **Páginas admin:** tema oscuro legacy `ndk-page`, `GlassCard`, gradientes púrpura/cyan — **inconsistente** con shell Forge claro.

### Tests existentes

| Área | Archivos | Notas |
|------|----------|-------|
| Observability admin | `tests/admin/observability-*.test.ts(x)` (5 archivos) | Componentes + API bridge |
| Onboarding wizard | `tests/integration/admin/test_saas_onboarding_wizard.test.tsx` | Integración |
| Governance UI | `tests/governance/findings-table.test.tsx` | Tabla hallazgos |
| Prometheus parse | `tests/admin/prometheus-parse.test.ts` | Parser |
| **Total ~tests/admin/** | 5 archivos | Sin E2E dedicado `/admin` |
| `/tenants`, `/admin/page` | **0 tests** | — |

### Última actividad de commit (archivos clave)

| Archivo | Último commit |
|---------|---------------|
| `app/admin/page.tsx` | 2026-05-20 — RAMON ALMONTE SORIANO |
| `app/tenants/page.tsx` | 2026-05-01 — GitHub Actions Bot |
| `forge-global-sidebar-nav.ts` | 2026-07-06 — RAMON ALMONTE SORIANO |

### Casos de uso reales

- **Superadmin día normal:** activar tenant, revisar gates, billing del tenant activo, API keys, readiness Google Ads, logs de auditoría tenant-scoped.
- **Información única:** Activación dry-run, fleet readiness, Google Ads tenant readiness, gates POST, WhatsApp config, sales scripts, QA piloto.
- **Acciones únicas:** `POST /api/v1/gates/*`, suite ops activation, observability SLA por tenant.
- **¿Podría trabajar sin ella?** Parcialmente — muchas funciones **no existen en Cockpit** (gates, activation, Google Ads readiness, api-keys). Cockpit no sustituye operaciones tenant-scoped legacy.

### Estado de mantenimiento

- **Mixto:** sidebar nav actualizado jul-2026; páginas core (`/admin`, `/tenants`) estancadas may-2026.
- **Deuda:** stats hardcoded en `/admin` ("4 tenants", "99.7% uptime"); `/tenants` con datos ficticios.
- **Clasificación:** **LEGACY ACTIVO con deuda de datos** — no deprecar sin migrar ops únicas.

---

## Consola B — Network Cockpit

### Path del layout

- `app/(cockpit)/layout.tsx` — fuentes + tema oscuro aislado (`data-cockpit-root`)
- `app/(cockpit)/cockpit/layout.tsx` — `CHAdminAccessGuard` + `CockpitProvider` + `CockpitShellLayout`
- **Bypass:** `AppGate` excluye `/cockpit` de `GlobalForgeAppShell`

### Sidebar / Topbar files

- `components/cockpit/CockpitSidebar.tsx`
- `components/cockpit/CockpitTopbar.tsx`
- `components/cockpit/CockpitShellLayout.tsx`
- `components/cockpit/CockpitUserMenu.tsx` (rama `fix/cockpit-exit-nav` / PR #310 — puede no estar en main)

### Items del sidebar y rutas

| Item | href | Page | Rol |
|------|------|------|-----|
| ← Dashboard tenant | `getPostLoginRedirectPath` → `/` | exit link | si `tenant?.id` |
| Vista de Red | `/cockpit` | `app/(cockpit)/cockpit/page.tsx` → `NetworkView` | admin network |
| Credit Hub | `/cockpit/credit` | `app/(cockpit)/cockpit/credit/page.tsx` → `CreditView` | admin network |
| Tenants | `/cockpit/tenants` | `app/(cockpit)/cockpit/tenants/page.tsx` → `TenantsView` | admin network |
| Usuarios | `/cockpit/users` | `app/(cockpit)/cockpit/users/page.tsx` → `UsersView` | admin network |
| Suscripciones y Planes | `/cockpit/plans` | `app/(cockpit)/cockpit/plans/page.tsx` → `PlansView` | **solo `platform_superadmin`** |

**Finance (en desarrollo, rama `finance-v3/*`):** `/cockpit/finance/*` — **no en main** al momento de auditoría.

### Endpoints consumidos (`platformFetch` → `/api/v1/cockpit/*`)

| Vista | Endpoints |
|-------|-----------|
| Network (`NetworkView`) | `GET network/health`, `network/cores`, `network/overview`, alerts |
| Credit (`CreditView`) | `GET credit/summary`, `credit/pipeline`, aml/audit/dealer (404→DEMO) |
| Tenants (`TenantsView`) | `GET/POST/PATCH /cockpit/tenants`; wizard usa `plans`, `network/cores` |
| Users (`UsersView`) | `GET/POST /cockpit/users`, `reset-password`, `users/roles` (roles 404→[]) |
| Plans (`PlansView`) | `GET /cockpit/plans` (404→[]), `GET network/stats` (usage) |
| Topbar | `fetchTenants`, `fetchOpenAlerts` |

**Patrón:** `platformFetch` exclusivo (`lib/platformApi.ts`); `fetchOrDemo` en `observability.ts` / `creditHub.ts` — badge `DataTruthBadge` cuando `data_source=none` o 404.

### Guard de rol

- `CHAdminAccessGuard`: `platform_superadmin` | `tenant_admin` únicamente (`roleKeyAllowsAdminNetwork`).
- `CockpitContext`: `isTenantAdminOnly` fuerza tenant filter; `isPlatformSuperadmin` desbloquea plans y acciones globales.
- Backend: `require_platform_scope` en routers cockpit (population 403 para tenant_admin en backend).

### Tema visual

- **Oscuro dedicado:** tokens `cockpit-*`, Inter + JetBrains Mono.
- **Design system:** parcialmente reusa `DataTruthBadge` de Credit Hub; resto custom cockpit.

### Tests existentes

| Archivo | Tests |
|---------|-------|
| `tests/cockpit/platform-fetch-separation.test.ts` | 4 — aislamiento fetch |
| `tests/cockpit/querystring-filters.test.ts` | 2 — query credit |
| `tests/cockpit/finance-v3/*.test.ts` | 22 — contratos (rama finance-v3) |
| `tests/credit-hub/system/CHAdminAccessGuard.test.tsx` | guard compartido |
| **E2E cockpit** | **0 specs** en `e2e/` |

### Última actividad de commit

| Archivo | Último commit |
|---------|---------------|
| `CockpitSidebar.tsx` | 2026-07-13 — RAMON ALMONTE SORIANO |
| `TenantsView.tsx` | 2026-07-10 — RAMON ALMONTE SORIANO |
| Cockpit stack general | PRs #294–#304 (jul-2026) |

### Casos de uso reales

- **Superadmin:** vista de red 18 tenants, cores con sparklines, CRUD tenants real, usuarios plataforma, planes/consumo.
- **Información única:** agregación cross-tenant vía cockpit API, credit pipeline global, semaphore red.
- **Acciones únicas:** wizard tenant 3-step con cores reales, toggle suspend tenant, crear usuario con reset token.
- **¿Podría trabajar sin ella?** Para **gestión de plataforma moderna, sí** — reemplaza `/tenants` mock y parte de admin. **No** para gates, activation, api-keys (aún).

### Estado de mantenimiento

- **Activo y en expansión** (Finance Cockpit v3.1 en curso).
- Redirect legacy: `/credit-hub/admin` → `/cockpit`.
- **Clasificación:** **CONSOLA OFICIAL emergente** para plataforma/analytics.

### Navegación hacia / desde Cockpit

- **Entrada:** `UserMenu` global → "Consola de Plataforma" (`/cockpit`) si `roleKeyAllowsAdminNetwork`.
- **Salida:** logo sidebar, item "Dashboard tenant", `CockpitUserMenu` (PR #310) → `/`.
- **Descubribilidad:** media — requiere menú usuario; no está en sidebar Forge principal.

---

## Consola C — Landing NADAKKI AI Suite

### Path

- `app/page.tsx` → **`/`** (post-login default: `getPostLoginRedirectPath` → `/` para `platform_superadmin` y `tenant_admin`)

### Componentes principales

- `useAgentRegistrySummary` → `AgentRegistryStatHome`
- `CORES_CONFIG` (`config/cores.ts`) — 20 dominios catálogo
- Quick links estáticos (`QUICK_LINKS`)
- Grid cores highlight + mapa completo

### Endpoints consumidos

| Dato | Endpoint |
|------|----------|
| Backend online | `GET /health` |
| Total tenants | `GET /api/v1/system/info` → `total_tenants` |
| Agentes (registry) | `GET /api/v1/system/agents/summary` |
| Dominios | **ninguno** — `CORES_CONFIG` estático local |

### Guard de rol

- Misma que shell global (`ProtectedRoute`). **Sin restricción de rol** en página — cualquier usuario autenticado con acceso a `/` la ve.

### Tema visual

- Oscuro `ndk-page` dentro de shell Forge claro.
- Branding pesado gradientes, motion (framer-motion stub).

### Tests

- `tests/agent-registry/AgentRegistryStatHome.test.tsx`
- `tests/agent-registry/fetch-agent-registry.test.ts`
- `tests/credit-hub/foundation/pages/credit-hub-home.test.tsx` (home relacionado)

### Última actividad

- `app/page.tsx`: 2026-05-02 — GitHub Actions Bot

### Casos de uso reales

- **Superadmin:** punto de entrada post-login, acceso rápido a hubs (Credit, SIC, Legal, Marketing), ver agent registry summary.
- **Información única:** mapa de 20 cores del catálogo de producto (marketing copy), arquitectura del producto en texto.
- **Acciones únicas:** ninguna operativa — solo navegación.
- **¿Podría trabajar sin ella?** Sí — es **welcome/discovery**, no consola admin.

### Estado de mantenimiento

- Estable pero **datos de cores son estáticos** (`agentCount` en config, no live).
- **Clasificación:** **LANDING / NAV HUB** — preservar, no confundir con consola operativa.

---

## Artefacto relacionado: `/dashboard` (CoreAgentsPanel)

- **Ruta:** `app/dashboard/page.tsx` → `CoreAgentsPanel`
- **Sidebar:** item "Dashboard" bajo Administración → `/dashboard`
- **Datos:** `GET /api/catalog/{core}/agents` por core
- **Uso:** explorar catálogo de agentes por core — **solapa** con `/admin/agents` y landing agent count.
- **Tests:** ninguno específico encontrado.

---

## Matriz de solapamiento funcional (Paso 5)

| Funcionalidad | Consola A | Consola B | Consola C | Endpoint(s) | Notas |
|---------------|-----------|-----------|-----------|-------------|-------|
| Listar tenants | Sí (`/tenants`) | Sí (`/cockpit/tenants`) | KPI count only | A: **mock**; B: `GET /cockpit/tenants` | **Conflicto datos:** 4 mock vs 18 live |
| Crear tenant | No (modal UI sin API real en `/tenants`) | Sí (wizard + POST) | No | B: `POST /cockpit/tenants` | A incompleto |
| Editar tenant | No | Sí (wizard PATCH) | No | B: `PATCH /cockpit/tenants/{id}` | |
| Suspender/activar tenant | No | Sí (toggle) | No | B: `PATCH` status | |
| Ver métricas por tenant | Sí (`/admin/usage`) | Parcial (plans usage table) | No | A: `/tenants/{id}/usage`; B: `network/stats` | |
| Gestión usuarios plataforma | No dedicado | Sí (`/cockpit/users`) | No | B: `/cockpit/users` CRUD | |
| Gestión agentes (catálogo) | Sí (`/admin/agents`, `/dashboard`) | No | Count en home | `/api/catalog/{core}/agents`, `/api/ai-studio/agents` | Tres UIs distintas |
| Agent Registry summary | No | No | Sí | `GET /api/v1/system/agents/summary` | Solo landing |
| Gestión planes/billing | Sí (`/admin/billing`) | Sí (`/cockpit/plans`) | Link quick | A: `/api/v1/billing/*`; B: `/cockpit/plans` (404→demo) | Solapamiento alto |
| Vista salud sistema | Sí (`AutonomousHealthPanel`, `/admin/system`) | Sí (`NetworkView` health) | Backend badge | A: `/api/v1/system/autonomous/*`; B: `/cockpit/network/health` | Métricas diferentes |
| System Health score (Governance) | Sí (`/admin/governance`) | No | No | Governance hooks | Solo A (+ superadmin) |
| Métricas por core (Credit, Legal…) | Parcial (`/dashboard`) | Sí (6 core cards + credit hub) | Catálogo estático | B: `/cockpit/network/cores`, `/credit/summary` | C es marketing static |
| Credit Hub admin global | Redirect legacy | Sí (`/cockpit/credit`) | Link | B: cockpit credit APIs | Legacy redirect |
| Google Ads readiness | Sí (`/admin/readiness`) | No | No | `lib/api/googleAdsTenantReadiness` | **Único en A** |
| API Keys management | Sí (`/admin/api-keys`) | No | No | `/api/v1/tenants/{id}/api-keys` | **Único en A** |
| Activación/onboarding | Sí (`/admin/activation`, `/admin/onboarding`) | No | No | suiteOps, onboarding wizard | **Único en A** |
| Gates / roles config | Sí (`/admin/gates`) | No | Quick link | `GET/POST /api/v1/gates` | **Único en A** |
| Auditoría/logs | Sí (`/admin/logs`, `/admin/audit`, observability) | Parcial (credit audit panel DEMO) | No | `/api/v1/audit/logs`, observability fetchers | A más completo |
| Consumo/uso por tenant | Sí (`/admin/usage`) | Sí (plans usage) | No | ver arriba | |
| Feature flags | Sí (`/feature-flags`) | No | No | UNKNOWN — page exists | superadmin |
| WhatsApp admin | Sí | No | No | tenant config APIs | |
| Fleet readiness | Sí (`/admin/readiness`) | No | No | suiteOps | |
| Observability SLA | Sí | No | No | observability API + SWR | |
| Finance / MRR / población | No | En desarrollo (`finance-v3`) | No | `/cockpit/finance/*`, `/population/*` | **Futuro B** |
| Matriz tenants×cores | No | En desarrollo (F6) | No | planned | |
| Tenant selector global | Sí (TenantContext en topbar Forge) | Sí (topbar select) | No | context localStorage | Dos selectores independientes |
| Salida a otra consola | Sidebar (no link cockpit) | Exit links → `/` | Links a hubs | — | Descubrimiento pobre A↔B |
| Multi-tenant RLS ops | Tenant-scoped APIs | Platform scope APIs | N/A | distintos prefijos | Modelos de auth distintos |

### Funcionalidad única por consola (resumen)

| Consola | Exclusivo |
|---------|-----------|
| **A** | Gates, Activation, Readiness/Google Ads, API Keys, WhatsApp admin, Governance Centinela, Observability SLA stack, Fleet ops, Sales scripts, QA piloto, DB status |
| **B** | Vista de red agregada, cores sparklines, credit pipeline global, CRUD tenants/users live, Finance Cockpit (roadmap), platform scope unificado |
| **C** | Welcome, 20-core catalog map, quick links discovery, Agent Registry stat home |

---

## Análisis de calidad y patrones (Paso 6)

| Criterio | Consola A | Consola B | Consola C |
|----------|-----------|-----------|-----------|
| TypeScript | Sí (mixto strict) | Sí — tipos en `lib/cockpit/types*` | Sí |
| Tests unitarios | ~5 archivos admin/observability | 6–28 (cockpit + finance-v3) | 3 agent-registry |
| Tests E2E | No dedicados | No | No |
| Design system | Legacy `GlassCard` + Forge shell clash | Cockpit tokens + DataTruthBadge | `ndk-page` + cores config |
| Tema | Shell claro / páginas oscuras | Oscuro consistente | Oscuro contenido |
| Data fetching | `fetch`/`apiFetch`/SWR/React Query | `platformFetch` + `fetchOrDemo` | `fetch` simple |
| Loading/error/empty | Parcial — muchas páginas con estados | Mejor — panels con error boundaries | Loading en stats |
| DEMO badge | Raro / inconsistente | **Sí** — `DataTruthBadge` explícito | "unavailable" para registry |
| ARIA | Parcial (`NavigationBar`) | Mejorando (sidebar aria-labels) | Básico |
| Responsive | Grid responsive admin | Sidebar móvil + collapse | md/lg grids |
| Último commit clave | May 2026 (stale pages) | Jul 2026 (activo) | May 2026 |
| Autor principal | Ramon + GitHub Actions Bot | Ramon (cockpit redesign) | GitHub Actions Bot |

**Calidad relativa (evidencia):** **B > A ≈ C** para admin plataforma; **A** gana en breadth operacional legacy; **C** es nav-only.

---

## Dependencia con el usuario (Paso 7)

| Consola | Roles acceso | Cómo llegar | Cómo salir | Descubrible |
|---------|--------------|-------------|------------|-------------|
| A | `tenant_admin`, `platform_superadmin`, `support_agent` (platform) | Sidebar "Administración" | Sidebar otros hubs / home | **Alta** — sidebar siempre visible |
| B | `platform_superadmin`, `tenant_admin` | UserMenu → Consola Plataforma; URL `/cockpit` | Exit → `/` (PR #310) | **Media-baja** — hidden en sidebar Forge |
| C | Cualquier autenticado en `/` | Post-login redirect | Sidebar / quick links | **Alta** — default home |

**Documentación usuario:** docs cockpit en `docs/cockpit/`; admin disperso en runbooks (`docs/runbooks/`). **Sin manual unificado.**

---

## Casos de uso reales por consola (Paso 8)

### Consola A — día típico superadmin

1. Revisar gates y activar capacidades piloto.
2. Verificar readiness Google Ads del tenant piloto.
3. Rotar API keys del tenant activo.
4. Revisar billing y usage del tenant en contexto.

**Sin Consola A:** pierde ops tenant-scoped críticas; Cockpit no las implementa.

### Consola B — día típico superadmin

1. Abrir vista de red — 18 tenants, salud cores.
2. Crear/editar tenant con wizard.
3. Gestionar usuarios plataforma.
4. (Futuro) Finance / población / matriz.

**Sin Consola B:** pierde vista agregada live y CRUD plataforma moderno; volvería a mocks de `/tenants`.

### Consola C — día típico

1. Aterrizar post-login.
2. Saltar a Credit Hub, Legal, o Admin Gates vía quick links.

**Sin Consola C:** navegable vía sidebar; pierde solo onboarding visual.

---

## Análisis de deprecabilidad (Paso 9)

| Consola | Si se elimina hoy | Dependencias código | Links entrantes | Tests | Fricción migración |
|---------|-------------------|---------------------|-----------------|---------|-------------------|
| **A** | Pérdida **alta** — gates, activation, api-keys, readiness, observability | ~30 páginas `app/admin/*`, `lib/admin/*`, componentes admin | Sidebar nav extenso, quick links home | ~8 tests | **Alta** (60–120h) |
| **B** | Pérdida **alta** — única fuente live tenants/users red | `components/cockpit/*`, `lib/cockpit/*`, `app/(cockpit)/*` | UserMenu, redirect credit-hub/admin | ~6–28 tests | **Muy alta** si se elimina; Finance v3 depende |
| **C** | Pérdida **baja** — reemplazable por sidebar | `app/page.tsx`, hooks agent registry | Post-login `/` default | 3 tests | **Baja** (4–8h) — cambiar redirect |

**Candidatos a deprecación parcial (no consola entera):**

- `app/tenants/page.tsx` — **mock** — reemplazable por `/cockpit/tenants` (baja fricción).
- `components/layout/Sidebar.tsx` — ya muerto.
- `/credit-hub/admin` — ya redirect.

---

## Estrategias de consolidación evaluadas (Paso 10)

### Estrategia 1: Cockpit oficial, deprecar Panel admin

**Migrar a Cockpit:** tenants, users, plans, network health, credit global, finance (v3).

**Mantener fuera (migrar después o microservicio):** gates, activation, api-keys, Google Ads readiness, observability SLA, governance.

**Código a retirar (eventual):** `app/tenants/page.tsx`, módulos duplicados billing/plans si parity, stats hardcoded `/admin`.

**Estimado:** 80–140h frontend + 40h backend ops endpoints bajo `/api/v1/cockpit/*`.

**Riesgo regresión:** **Alto** — ops tenant-scoped sin equivalente cockpit; admins pierden gates/api-keys hasta migrar.

**Pros:** una UX oscura moderna, datos live, finance unificado.  
**Contras:** elimina ops únicas de A; sidebar Forge admin queda hueco.

---

### Estrategia 2: Panel admin oficial, mover Finance Core al Panel admin

**Migrar:** Finance views a `app/admin/finance/*` con shell Forge claro.

**Retirar:** `app/(cockpit)/**` (~15 componentes, lib/cockpit).

**Estimado:** 100–160h re-skin finance + rewire fetch; pierde inversión cockpit redesign (#294–#304).

**Riesgo:** **Muy alto** — `platformFetch` / population / finance backend acoplados a prefijo cockpit; CHAdminAccessGuard y tests perdidos.

**Pros:** un solo shell Forge familiar.  
**Contras:** destruye trabajo jul-2026; peor honestidad de datos (A tiene mocks); tema inconsistente persiste.

---

### Estrategia 3: Cohabitación con enlaces cruzados y roles diferenciados (RECOMENDADA)

**Panel admin (A) = consola operacional tenant-scoped**

- Gates, activation, readiness, api-keys, billing por tenant, observability, WhatsApp, config.

**Cockpit (B) = consola analítica / plataforma cross-tenant**

- Vista de red, finance, población, matriz, tenants/users CRUD live.

**Landing (C) = welcome / discovery**

- Post-login home; links cruzados explícitos a ambas consolas.

**Enlaces cruzados propuestos:**

1. Sidebar Forge admin → item "Network Cockpit" → `/cockpit`.
2. Cockpit sidebar → "Operaciones tenant" → `/admin` (tenant activo).
3. UserMenu — mantener ambos entry points.
4. Deprecar `/tenants` mock → link solo a `/cockpit/tenants`.

**Mover de A → B (reducir solapamiento):** listado tenants, usuarios plataforma, planes agregados, salud de red agregada.

**Mantener en A:** todo lo tenant-scoped ops listado arriba.

**Estimado:** 24–40h (cross-links, deprecate `/tenants`, documentación, QA) + Finance v3 ya en curso en B.

**Riesgo:** **Medio-bajo** — additive; no big-bang delete.

**Pros:** respeta evidencia — cada consola tiene exclusivos reales; migración incremental; Finance v3 continúa.  
**Contras:** dos shells coexisten; requiere disciplina UX y docs.

---

## Recomendación de Cursor

**Estrategia 3 (cohabitación)** — basada en evidencia:

1. **Cockpit es la única fuente live** para tenants de red (`platformFetch`, 18 tenants prod) — confirmado F0 y `TenantsView.tsx`.
2. **Panel admin conserva 10+ capacidades sin equivalente** en cockpit (gates, activation, api-keys, Google Ads readiness, governance).
3. **Panel admin tiene deuda de datos** (mock tenants, hardcoded stats) — no es candidato a "consola oficial" sin rework masivo.
4. **Landing `/` no compite** — cumple rol distinto.
5. **Inversión activa** (Finance v3, PRs cockpit jul-2026) está en rama B — costo hundido favorece B para analytics.

**Acciones inmediatas (sin borrar):**

1. Marcar `/tenants` como **DEPRECATED** en UI → redirect o banner a `/cockpit/tenants`.
2. Añadir cross-links A↔B en sidebars (post PR #310 merge).
3. Documentar en `docs/cockpit/` mapa "ops vs analytics".
4. No eliminar `app/admin/*` hasta parity checklist por módulo.

---

## Preguntas abiertas para el humano

1. ¿`support_agent` (core platform) debe ver Cockpit o solo Panel admin?
2. ¿Billing canónico es `/admin/billing` (tenant-scoped v1) o `/cockpit/plans` (platform) tras Finance v3?
3. ¿Governance (`/admin/governance`) queda en A o se mueve a Cockpit como panel "Compliance plataforma"?
4. ¿Post-login home sigue siendo `/` o debe ser `/cockpit` para `platform_superadmin`?
5. ¿PR #310 (exit UX) merge antes de cross-links — confirmado por César?
6. ¿Eliminar físicamente `app/tenants/page.tsx` o mantener redirect permanente?

---

## Próximo paso propuesto

**Prompt sugerido para Cursor (tras decisión humana):**

> TASK: Consolidación Consolas Fase 1 — Cross-links y deprecación suave  
> Modo: single PR, GR-12. Sin eliminar `app/admin/*`.  
> 1. Banner DEPRECATED en `/tenants` → link `/cockpit/tenants`.  
> 2. Item "Network Cockpit" en sección Administración de `forge-global-sidebar-nav.ts`.  
> 3. Item "Operaciones tenant" en `CockpitSidebar` → `/admin`.  
> 4. Actualizar `docs/cockpit/QA_CHECKLIST.md` con matriz ops vs analytics.  
> 5. Tests: navegación cross-link + guard roles.  
> Gate: build + tests cockpit/admin verdes.

---

## Apéndice — Comandos de inventario ejecutados

```powershell
Get-ChildItem -Recurse -Directory -Path app | Where-Object { $_.FullName -match "cockpit|admin|dashboard|forge|tenant|nadakki-demo" }
git log -1 --format="%ai %an" -- app/admin/page.tsx app/page.tsx components/cockpit/CockpitSidebar.tsx
```

**Reglas respetadas:** sin `npm install`, sin `build`, sin `git checkout`, sin commits, sin PRs.
