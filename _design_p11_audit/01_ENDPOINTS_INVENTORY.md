# FASE 1 — Inventario de endpoints (backend `nadakki-ai-suite`)

**Fecha:** 2026-05-09  
**Repo backend:** `C:\Users\cesar\Projects\nadakki-ai-suite\nadakki-ai-suite`  
**Git short SHA (backend):** `698b500a` (al momento de la auditoría)

---

## Metodología

| Métrica | Cómo se obtuvo |
|--------|----------------|
| **Rutas montadas en FastAPI** | Importación única de `main.app` con `DATABASE_URL` SQLite temporal; recuento de rutas con `.methods` → **640** rutas HTTP registradas (incluye duplicados por mismo router montado en `/api/v1` y `/api/v2`, OPTIONS, etc.). |
| **Decoradores `@router.<verb>`** | Recuento con grep sobre `routers/**`, `backend/routers/**`, `api/**`, `backend/observability/**` excluyendo tests → **524** ocurrencias (código fuente, no necesariamente todas montadas en una sola app). |
| **Expectativa documentada** | Memoria de proyecto ~343 rutas “de negocio”; el recuento real montado es mayor por duplicación SIC v1/v2, RouteOne, alias legal, y métodos OPTIONS. |

**NOTA:** Una tabla “Path | Verb | …” con las **640** filas sería impracticable en Markdown; este documento prioriza **catálogo de `include_router`**, **agrupación por dominio**, y **muestras representativas**. Para listado máquina-legible usar `/openapi.json` en runtime.

---

## A — `include_router` en `main.py` (orden aproximado de registro)

Los routers se registran en bloques; muchos usan `prefix` en el propio `APIRouter`; otros reciben `prefix=` en `include_router`.

| # | Línea ref. | Router / variable | Prefix extra en `include_router` |
|---|------------|-------------------|----------------------------------|
| 1 | ~316 | `marketing_router` | — |
| 2 | ~319 | `social_status_router` | — |
| 3 | ~322 | `social_listening_router` | — |
| 4 | ~326–327 | OAuth Meta / Google | — |
| 5 | ~330 | `google_refresh_pg_router` | — |
| 6 | ~334–336 | agent_execution, pipeline, scheduler | — |
| 7 | ~341,349 | system_health_autonomous, system_agent_registry | — |
| 8 | ~361 | `sic_agents_router` | `/api/v1/sic` |
| 9 | ~403–420 | SIC RouteOne / PR-B suite (~17 routers) | `_sic_rt_prefix` (variable; típicamente prefijo credit/routeone) |
| 10 | ~429–430 | campaigns_v2, campaign_pilot | — |
| 11 | ~434 | marketing_media | — |
| 12 | ~441,452 | marketing_schedule, marketing_products | `/api/marketing` |
| 13 | ~463 | tenant_editorial | — |
| 14 | ~467–468 | advertising, analytics | — |
| 15 | ~472 | marketing_os | — |
| 16 | ~478–479 | autopilot, autopilot_cycle | — |
| 17 | ~485 | reports | — |
| 18 | ~488 | audit | — |
| 19 | ~491 | tenant_onboarding | — |
| 20 | ~495 | **tenant_router** (`backend/routers`) | ya trae `prefix=/api/v1` |
| 21 | ~498 | tenant_modules | — |
| 22 | ~504 | google_ads_tenant_readiness | — |
| 23 | ~513 | tenant_profile | — |
| 24 | ~519–531 | offer_strategy, sales_script, whatsapp, booking, closer | — |
| 25 | ~549–624 | onboarding_ops, GA ops/fundamentals/modules, LP readiness, CI, spyfu×3, autonomous_orchestrator | — |
| 26 | ~633 | knowledge_pipeline | — |
| 27 | ~637–639 | api_keys, usage, billing (`backend/routers`) | ya prefijados |
| 28 | ~643–757 | legal + expedientes modular stack + strategy/pdf/knowledge… | varios |
| 29 | ~767 | billing_v2 (opcional) | `/api/v2/billing` |
| 30 | ~777+ | otro bloque billing legacy | ver archivo |
| 31 | ~788 | observability | — |
| 32 | ~792 | ame_router | — |
| 33 | ~797–820 | **SIC core / expedientes / cases / comité / métricas / portafolio / config / auth** | `/api/v1` + subpaths |
| 34 | ~825–840 | **Mismo conjunto SIC duplicado** | `/api/v2` + `/api/v2/sic/*` |
| 35 | ~842–843 | sic_simulador | `/api/v1` y `/api/v2` |
| 36 | ~850 | sic_multitenant_router | `/api/v2` → rutas bajo `/api/v2/sic-mt` |
| 37 | ~856–867 | billing opcional v2 | `/api/v1/billing` o sin prefijo según router |
| 38 | ~3083 | config_router (debug) | si `_DEBUG_ENABLED` |
| 39 | ~3092–3108 | **credit_router**, **consent_router**, **tenant_branding_router** | prefijos en archivo router (`/api/v2/credit`, etc.) |
| 40 | ~3121+ | audit_router (agents), brain_router | — |

**Duplicación relevante:** Los routers `sic_router`, `sic_cases_router`, `sic_comite_router`, etc., están montados **dos veces** (`/api/v1` y `/api/v2`), duplicando exponencialmente rutas en OpenAPI.

---

## B — Agrupación por dominio (verbos + paths relativos típicos)

Estado: **WORKING** por defecto si el router se monta; **STUB** solo donde el código documenta 503/placeholder; **DEPRECATED** si hay comentario explícito.

| Dominio | Router principal | Prefix efectivo (típico) | Auth típico | DB |
|---------|------------------|---------------------------|-------------|-----|
| Credit core | `routers/credit_router.py` | `/api/v2/credit` | `X-Tenant-ID` obligatorio en mayoría | Postgres/SQLite + tablas credit |
| Consent remoto | `routers/consent_router.py` | `/api/v2/credit/consent` | Header tenant + JWT en rutas públicas | `get_session`, tablas consent |
| Tenant / billing | `backend/routers/tenant_router.py`, billing, api_keys | `/api/v1` | Admin `X-Role`, tenant paths | tenants, tenant_config |
| Branding | `routers/tenant_branding_router.py` | `/api/v2/tenants` | Opcional `X-Tenant-ID` (403 mismatch) | `tenant_branding` |
| SIC expedientes | `routers/sic_expedientes_router.py` | montado bajo `/api/v1/sic` y `/api/v2/sic` | AMBIGUOUS | sic_* tablas |
| SIC cases | `routers/sic_cases_router.py` | `/sic/cases` + `/sic/expedientes` aliases | AMBIGUOUS | sic_* |
| Legal expedientes | `api/legal/expedientes/router.py` + includes | `/api/v1/legal/cases/*` | tenant isolation | Postgres-heavy |
| SpyFu | `routers/spyfu_router.py` | `/api/v1/spyfu` | API keys internas | spyfu / externos |
| OAuth | `routers/auth/*.py` | `/auth/meta`, `/auth/google` | OAuth state | SQLite TokenStore + PG oauth_tokens |
| Marketing | campaigns_v2, schedule, media | `/campaigns`, `/api/marketing`, etc. | AMBIGUOUS | mixed |

---

## C — Muestra tabla detallada (subconjunto representativo)

| Path | Verb | Router archivo | Status | Auth | DB Tables (ejemplo) | Description |
|------|------|----------------|--------|------|---------------------|-------------|
| `/api/v2/credit/health` | GET | credit_router.py | WORKING | opcional | credit apps | Health credit core |
| `/api/v2/credit/applications` | GET | credit_router.py | WORKING | X-Tenant-ID | applications | Lista solicitudes |
| `/api/v2/credit/stats` | GET | credit_router.py | WORKING | X-Tenant-ID | aggregates | Estadísticas tenant |
| `/api/v2/credit/analytics/dashboard` | GET | credit_router.py | WORKING | X-Tenant-ID | analytics | KPI dashboard |
| `/api/v2/tenants/{id}/branding` | GET | tenant_branding_router.py | WORKING | Header opcional | tenant_branding | Branding Forge |
| `/api/v1/sic/expedientes/{id}` | GET | sic_expedientes_router.py | WORKING | AMBIGUOUS | sic_expedientes | Detalle expediente |
| `/api/v2/sic-mt/health` | GET | sic_multitenant_router.py | WORKING | X-Tenant-ID | tenants/config | Health multi-tenant SIC |
| `/auth/meta/status/{tenant}` | GET | meta_oauth.py | WORKING | — | oauth_tokens / SQLite | Estado Meta |

*(La tabla completa de 640 rutas debe exportarse desde OpenAPI.)*

---

## D — Hallazgos de arquitectura

1. **Superficie API muy grande** por diseño modular + montajes duplicados v1/v2.  
2. **Credit / consent / tenant / branding** son los más relevantes para **Forge Credit Hub**.  
3. **SpyFu / marketing / legal** añaden cientos de rutas no usadas por el demo Forge pero activas en la misma app.

---

## Resultado FASE 1

**FASE 1 COMPLETA — ~640 rutas HTTP montadas** en la app FastAPI (recuento en runtime); **524** decoradores `@router.*` en código fuente de routers; catálogo `include_router` documentado arriba.

**Archivo:** `_design_p11_audit/01_ENDPOINTS_INVENTORY.md`
