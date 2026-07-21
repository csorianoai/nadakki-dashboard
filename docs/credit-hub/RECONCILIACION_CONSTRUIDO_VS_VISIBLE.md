# Reconciliación: construido vs. visible — Credit Hub (dealer-banco)

**Modo:** AUDIT_ONLY (solo lectura)  
**Fecha:** 2026-07-01  
**Repo:** `nadakki-dashboard` @ `origin/main`  
**Backend medido:** `https://nadakki-ai-suite.onrender.com`

---

## Resumen ejecutivo

| Área | Hallazgo |
|------|----------|
| Rutas frontend | **29 rutas productivas** en repo (`21` dealer/banco/wizard/hub + `8` monetización). Páginas existen bajo `app/(forge)/credit-hub/`. |
| Flag monetización | **OFF por defecto** en repo. Solo bloquea `/credit-hub/monetizacion/*` (404 vía `notFound()`). |
| Backend | `/health` OK (200). **85 endpoints** credit en OpenAPI. Login responde pero **p50 ≈ 13,6 s**. |
| Deploy Vercel | **INPUT_CESAR** — SHA de producción no accesible desde el repo. |
| **Causa raíz** | **(a) LOGIN** — latencia medida del POST `/api/v2/auth/login` (~13,5 s p50) + cadena sesión `refresh`→`/me` con timeout 8 s bloquea entrada al dashboard. |

**Clasificación global:** 🔴 **ROJO** (bloqueo operativo de acceso) · 🟡 **AMARILLO** (deploy no verificado, monetización mock-first) · 🟢 **VERDE** (rutas montadas, backend vivo, flag acotado a monetización)

---

## 1. FRONTEND — inventario real

### 1.1 Metodología

- Inventario desde `app/**/page.tsx` (grep + glob), no de memoria.
- **API real:** hooks/clients que llaman `/api/v2/credit/*`, `/credit/*`, `/api/v2/tenants/*/branding`, etc.
- **Fixtures:** import directo de `lib/credit-hub/monetizacion/fixtures.ts` o adapter con `USE_API=false`.
- **Simulación local:** lógica cliente sin backend (p. ej. preaprobación, laboratorio realtime).
- **Columna “Tras flag”:** ¿requiere `NEXT_PUBLIC_FF_FORGE_MONETIZACION=1|true|on` para montarse? Implementado en `app/(forge)/credit-hub/monetizacion/layout.tsx` → `notFound()` si OFF.

### 1.2 Rutas Forge Credit Hub — dealer / banco / wizard (21 rutas, flag OFF)

| Ruta | ¿Página existe? | ¿API real o fixtures? | ¿Tras flag? | Endpoint(s) que llama |
|------|-----------------|----------------------|-------------|------------------------|
| `/credit-hub` | ✅ `app/(forge)/credit-hub/page.tsx` | Estático (links portal) | NO | — |
| `/credit-hub/admin` | ✅ | ROADMAP UI + tenant config | NO | `GET /api/v2/tenants/{id\|slug}/branding` (vía `useTenantBranding`) |
| `/credit-hub/bank` | ✅ | API real | NO | `GET /api/v2/credit/applications/queue`, `GET /api/v2/credit/analytics/dashboard` |
| `/credit-hub/bank/applications` | ✅ | API real | NO | `GET /api/v2/credit/applications/queue`, `POST /api/v2/credit/applications/bulk-decide` |
| `/credit-hub/bank/applications/[applicationId]` | ✅ | API real | NO | `GET /api/v2/credit/applications/{id}`, `GET .../compliance/{id}`, `GET .../audit-trail`, `GET .../counter-offer` |
| `/credit-hub/bank/analytics` | ✅ | API real | NO | `GET /api/v2/credit/analytics/dashboard`, `GET .../dealers-ranking`, `GET .../portfolio-health` |
| `/credit-hub/bank/compliance` | ✅ | API real | NO | `GET /api/v2/credit/compliance/{id}` (N apps en cola) |
| `/credit-hub/bank/audit` | ✅ | API real | NO | `GET /api/v2/credit/applications/{id}/audit-trail` (N apps en cola) |
| `/credit-hub/dealer` | ✅ | API real | NO | `GET /api/v2/credit/applications`, `GET /api/v2/credit/stats` |
| `/credit-hub/dealer/applications` | ✅ | API real | NO | `GET /api/v2/credit/applications` |
| `/credit-hub/dealer/applications/[applicationId]` | ✅ | API real | NO | `GET /api/v2/credit/applications/{id}`, `GET .../events`, offers via `offersClient` |
| `/credit-hub/dealer/preapproval` | ✅ | Simulación local | NO | — (motor `lib/credit/simulation/scenario-engine`, config tenant) |
| `/credit-hub/dealer/profile` | ✅ | Config tenant | NO | Branding API + defaults DO |
| `/credit-hub/dealer/notifications` | ✅ | Derivado API | NO | `GET /api/v2/credit/applications` → transform local |
| `/credit-hub/dealer/applications/new` | ✅ (redirect) | — | NO | Redirige a `.../applicant` |
| `/credit-hub/dealer/applications/new/applicant` | ✅ | API real (wizard) | NO | Wizard: `POST /api/v2/credit/applications` al submit |
| `/credit-hub/dealer/applications/new/vehicle` | ✅ | API real (wizard) | NO | `POST .../applications/{id}/vehicle` |
| `/credit-hub/dealer/applications/new/co-borrower` | ✅ | API real (wizard) | NO | Payload en draft → submit |
| `/credit-hub/dealer/applications/new/consent` | ✅ | API real | NO | `POST /api/v2/credit/consent/{app}/initiate`, polling `GET .../consent/{token}/status` |
| `/credit-hub/dealer/applications/new/documents` | ✅ | API real (wizard) | NO | `POST .../documents`, `POST .../documents/process-all` |
| `/credit-hub/dealer/applications/new/complete` | ✅ | Estático/post-submit | NO | — |

**Redirects activos (`next.config.js`):** `/credit-hub/dealer/simulator` → preapproval; `/credit-hub/bank/queue` → applications; varios `/credit/*` → `/credit-hub/*`.

### 1.3 Rutas monetización (8 productivas + 1 sandbox, flag ON)

| Ruta | ¿Página existe? | ¿API real o fixtures? | ¿Tras flag? | Endpoint(s) |
|------|-----------------|----------------------|-------------|---------------|
| `/credit-hub/monetizacion/dashboard` | ✅ | **Fixtures** (`adapter.ts`, `USE_API=false`) | **SÍ** | — (mock `DASHBOARD_KPIS`, `DRILLDOWNS`) |
| `/credit-hub/monetizacion/ingresos` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/costo-margen` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/configuracion` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/metricas-banco` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/metricas-dealer` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/estado-cuenta` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/reconciliacion` | ✅ | Fixtures | **SÍ** | — |
| `/credit-hub/monetizacion/sandbox` | ✅ | Fixtures directo | **SÍ** | — (`INVOICE_MAY_2026` import) |

Gate: `lib/env/feature-forge-monetizacion.ts` + `monetizacion/layout.tsx`. Nav oculta grupo en `forge-global-sidebar-nav.ts` si flag OFF.

### 1.4 Rutas legacy `/credit/*` (fuera de Forge, 6 rutas)

| Ruta | ¿Página existe? | ¿API real o fixtures? | ¿Tras flag? | Endpoint(s) |
|------|-----------------|----------------------|-------------|---------------|
| `/credit` | ✅ `app/credit/page.tsx` | API real | NO | `GET /api/v2/credit/health`, `GET /api/v2/credit/applications`, `GET /api/v2/credit/stats` |
| `/credit/new` | ✅ | API real | NO | `POST /api/v2/credit/applications`, `POST .../process` |
| `/credit/dashboard` | ✅ | API real | NO | `GET /credit/dashboard/summary` (rewrite → backend) |
| `/credit/[id]` | ✅ | API real | NO | `GET /api/v2/credit/applications/{id}`, `GET .../events` |
| `/credit/dealer/analytics` | ✅ | API real (flag propio) | NO | Dealer analytics API (`NEXT_PUBLIC_FEATURE_DEALER_ANALYTICS`) |
| `/credit/dealer/real` | ✅ | Simulación / WebSocket | NO | WS opcional; simulación local |

### 1.5 Rutas legacy `/bank/*` (paralelas al hub, 4 rutas)

| Ruta | ¿Página existe? | ¿API real o fixtures? | ¿Tras flag? | Endpoint(s) |
|------|-----------------|----------------------|-------------|---------------|
| `/bank/applications/[id]` | ✅ `app/(bank)/bank/applications/[id]/page.tsx` | API real | NO | `fetchBankApplicationDetail` → `/api/v2/credit/applications/{id}` |
| `/bank/applications/[id]/stipulations` | ✅ | API real | NO | Stipulations workflow endpoints |
| `/bank/analytics` | ✅ `app/bank/analytics/page.tsx` | API real | NO | Analytics clients |
| `/workflow-real` | ✅ `app/(bank)/workflow-real/page.tsx` | API real | NO | Bank workflow |

### 1.6 Rutas dev / diseño (existen, no productivas)

| Ruta | Notas |
|------|-------|
| `/credit-hub/components` | Demo UI estática |
| `/credit-hub/preview` | Preview shell |
| `/credit-hub/_design/shell-preview` | Inventario diseño |

### 1.7 Conteo de rutas montables

| Escenario | Rutas montables |
|-----------|-----------------|
| **Flag OFF** (`NEXT_PUBLIC_FF_FORGE_MONETIZACION` unset) | **21** dealer/banco/wizard/hub (+ admin). Monetización → **404**. Legacy `/credit/*` y `/bank/*` siguen montadas. |
| **Flag ON** | **21 + 8 = 29** rutas productivas Forge (+ sandbox = 30). Nav muestra grupo Monetización. |

### 1.8 Valor del flag en build actual

| Fuente | Valor |
|--------|-------|
| `lib/env/feature-forge-monetizacion.ts` | Default **OFF** (vacío → false) |
| `next.config.js` | **No define** el flag |
| `.env.example` | **No incluye** `NEXT_PUBLIC_FF_FORGE_MONETIZACION` |
| Vercel env producción | **INPUT_CESAR** |

**Conclusión repo local:** build sin override → flag **OFF**. Solo faltan las 8 pantallas monetización (comportamiento esperado).

### 1.9 Gate de acceso (por qué “no se ve” antes de llegar a rutas)

Todo excepto `/login` y `/consent/*` pasa por `AppGate` → `ProtectedRoute`:

- Spinner “Verificando sesion…” mientras `isLoading`
- Error “El servidor no respondió a tiempo…” si `initError` (timeout 8 s en `auth-context.tsx`)
- Redirect a `/login` si no autenticado
- **`return null`** (pantalla en blanco) brevemente si no autenticado

Post-login redirect (`getPostLoginRedirectPath`) envía roles típicos a **`/`**, no a `/credit-hub` — el hub está en sidebar (`alwaysVisible: true` en nav Credit Hub).

---

## 2. BACKEND — endpoints vivos (medido)

**Hostname:** `nadakki-ai-suite.onrender.com`

### 2.1 `/health` — cold vs warm

| Hit | Status | Latencia |
|-----|--------|----------|
| 1 (post-idle ~2 s) | 200 | **518 ms** |
| 2 (+2 s) | 200 | **181 ms** |

Render no estaba completamente frío en hit 1; warm es ~3× más rápido.

### 2.2 POST login (sin credenciales reales)

Endpoint: `POST /api/v2/auth/login`  
Body: email/password de prueba inválidos (solo status/latencia).

| Intento | Status | Latencia |
|---------|--------|----------|
| 1 | 401 | 17 414 ms |
| 2 | 401 | 13 349 ms |
| 3 | 401 | 13 563 ms |
| **p50 (3 intentos)** | 401 | **13 563 ms** |

El endpoint **responde** (401 esperado), pero tarda **>13 s** en servidor ya caliente.  
Frontend: `AUTH_LOGIN_TIMEOUT_MS = 30_000` (`lib/api/auth-v2.ts`). Login page hace warmup a `/health` al montar.

### 2.3 Cadena sesión (N+1 en restore)

| Paso | Endpoint | Status (probe) | Latencia warm |
|------|----------|----------------|---------------|
| Refresh | `POST /api/v2/auth/refresh` | 401 (token inválido) | 785 ms |
| Me | `GET /api/v2/auth/me` | 401 (Bearer inválido) | 276 ms |

En restore real (`auth-context.tsx`): `refresh` → `getMeV2` secuencial, **`SESSION_INIT_TIMEOUT_MS = 8_000`**. Si cold-start empeora login/refresh, la sesión falla antes de mostrar el dashboard.

### 2.4 OpenAPI

- `GET /openapi.json` → **200**, ~842 KB
- **85 paths** bajo `/api/v2/credit/*` y `/credit/*` (sin SIC)
- **`components.securitySchemes` vacío** en el schema publicado — OpenAPI no declara JWT explícitamente

### 2.5 JWT vs middleware — probes sin auth

| Endpoint | Sin Bearer | Interpretación |
|----------|------------|----------------|
| `GET /health` | 200 | Público |
| `POST /api/v2/auth/login` | 401 (credenciales inválidas) | Público (no exige JWT previo) |
| `GET /api/v2/credit/applications/queue` | **401** | **Exige JWT** (+ RLS backend) |
| `GET /api/v2/credit/applications` | **401** | **Exige JWT** (+ RLS backend) |

Middleware Next.js (`middleware.ts`): aislamiento tenant en `/api/*` solo si hay Bearer; rutas credit del browser van por rewrite same-origin con JWT desde `tokenStorage` / `chFetch`.

Endpoints core usados por el dashboard:

```
GET  /api/v2/credit/applications
GET  /api/v2/credit/applications/queue
GET  /api/v2/credit/applications/{id}
GET  /api/v2/credit/stats
GET  /api/v2/credit/analytics/dashboard
GET  /api/v2/credit/compliance/{id}
GET  /api/v2/credit/applications/{id}/audit-trail
POST /api/v2/credit/applications
POST /api/v2/credit/consent/{id}/initiate
GET  /credit/dashboard/summary
GET  /credit/applications/{id}/offers
GET  /api/v2/tenants/{id}/branding
POST /api/v2/auth/login
```

Todos los credit (excepto consent public token paths) → **401 sin JWT** en probe directo al backend.

---

## 3. DEPLOY — construido vs desplegado

| Métrica | Valor |
|---------|-------|
| `git rev-parse origin/main` | **`98334b4678b4b8fc9118024c4bdb29ba1e1985f4`** |
| Último commit main | 2026-07-01 12:38:19 -0400 — Merge PR #245 `feat/forge-monetizacion-m9-minor-fixes` |
| SHA deploy Vercel producción | **INPUT_CESAR** |
| ¿Coinciden? | **No verificable** desde repo |

**Riesgo:** si Vercel sirve SHA anterior a la migración `/credit-hub/*`, el dashboard mostraría código viejo. Sin SHA de Vercel no se puede confirmar ni descartar **(b) DEPLOY**.

`next.config.js` expone `NEXT_PUBLIC_CH_BUILD_SHA` desde `VERCEL_GIT_COMMIT_SHA` — Cesar puede comparar en runtime del dashboard desplegado.

---

## 4. VEREDICTO — causa raíz

### Clasificación: **(a) LOGIN** 🔴 ROJO

**Evidencia concreta:**

1. **Login POST p50 = 13,6 s** medido contra producción Render (3 intentos, servidor warm tras health checks). Usuario ve botón “Iniciando sesión…” >10 s; riesgo de abandono percibido como “no carga”.
2. **Session init timeout 8 s** vs cadena `refresh` + `/me` en `lib/auth/auth-context.tsx` — en cold start la verificación de sesión puede fallar con *“El servidor no respondió a tiempo”* aunque `/health` responda en <1 s.
3. **`ProtectedRoute`** bloquea **todo** el dashboard (incl. Credit Hub) hasta auth OK → sin login completado, **no se ve ninguna ruta** dealer/banco.
4. Rutas **existen y montan** sin flag (21 rutas) — descarta **(d) ROUTING** como causa primaria de “no se ve nada”.
5. Flag OFF solo oculta **8** rutas monetización — descarta **(c) FLAG** como causa de ausencia total del core dealer/banco.
6. **(b) DEPLOY** queda **no falsado** — requiere SHA Vercel de Cesar.

### Fixes acotados (reporte only — no aplicados)

| Prioridad | Fix | Alcance |
|-----------|-----|---------|
| P0 | Reducir latencia `POST /api/v2/auth/login` en Render (always-on, optimizar query N+1 backend, índices) | Backend |
| P0 | Alinear `SESSION_INIT_TIMEOUT_MS` (8 s) con `AUTH_LOGIN_TIMEOUT_MS` (30 s) o paralelizar refresh/me | `lib/auth/auth-context.tsx` |
| P1 | Confirmar `VERCEL_GIT_COMMIT_SHA === 98334b4…` en prod | **INPUT_CESAR** |
| P2 | Activar monetización solo cuando se quiera: `NEXT_PUBLIC_FF_FORGE_MONETIZACION=1` + cablear `NEXT_PUBLIC_FM_USE_API=true` | Vercel env + adapter |

### Matriz de clasificación

| Hipótesis | Estado | Severidad |
|-----------|--------|-----------|
| (a) LOGIN | **Confirmada por medición** | 🔴 ROJO |
| (b) DEPLOY | No verificable | 🟡 AMARILLO |
| (c) FLAG | Comportamiento correcto (solo −8 rutas) | 🟢 VERDE |
| (d) ROUTING | Páginas montadas; gate es auth | 🟢 VERDE |

---

## Anexo — archivos clave verificados

| Concern | Archivo |
|---------|---------|
| Flag monetización | `lib/env/feature-forge-monetizacion.ts`, `app/(forge)/credit-hub/monetizacion/layout.tsx` |
| Adapter mock | `lib/credit-hub/monetizacion/adapter.ts` (`USE_API=false` default) |
| Auth / timeouts | `lib/api/auth-v2.ts`, `lib/auth/auth-context.tsx` |
| Gate UI | `components/auth/AppGate.tsx`, `components/forge/auth/ProtectedRoute.tsx` |
| API credit | `lib/credit-hub/api/creditCoreClient.ts`, `lib/credit-hub/api/bankClient.ts` |
| Rewrites backend | `next.config.js` |
| Nav Credit Hub | `components/forge/layout/forge-global-sidebar-nav.ts` |

---

*Generado en modo AUDIT_ONLY. Sin modificaciones al código ni merge.*
