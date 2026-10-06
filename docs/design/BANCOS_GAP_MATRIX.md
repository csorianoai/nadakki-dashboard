# BANCOS — Matriz de huecos para el rediseño del panel de bancos (Fase B0)

Alcance: todo el lado banco de Credit Hub (Mesa de decisiones, Bandeja, Detalle, Analítica, Cumplimiento, Auditoría, KPIs de banco, Filtros de pool, Escalaciones, Vehículos y las pantallas sueltas del lado banco), más las pantallas del menú de Credit Hub que el usuario ve junto a ellas (Dealer, Nueva solicitud, Preaprobación, Dealer — listado).

Fase B0 = **solo documentación**. No se cambia código.

## Cómo se midió

- Frontend: lectura de código en `nadakki-dashboard`, rama basada en `staging` @ `a24c728`.
- Backend: lectura de código en `nadakki-ai-suite` @ `ec7d945` (rutas, montaje en `main.py`, servicios).
- **No se ejecutó nada contra staging ni producción.** "REAL" significa que el código pide los datos al backend y los pinta, sin datos de ejemplo de respaldo. No se comprobó en vivo que el backend responda con datos para un tenant concreto.
- Comprobados a mano: el redirect de `/compliance`, la guarda de `mockOnly`, `chMoney` con RD$ fijo, la regla fija de la acción masiva, el SLA fijo del backend, los `bank/kpis/*` sin control de rol, `trends` contando como fondeado más que DISBURSED y `avg_decision_time_hours = None`. El resto de las referencias archivo:línea vienen de la lectura de código y no se volvieron a comprobar una por una.

Leyenda de datos: **REAL** = backend · **DEMO** = datos fijos o fixtures · **MIXTO** = parte real, parte fija.

---

## 1. Inventario de pantallas

### 1.0 Comunes al portal banco (`/credit-hub/bank/**`)

| Aspecto | Hoy | Referencia |
|---|---|---|
| Shell | `RouteErrorBoundary` → `BankChShell` → `CHTenantGuard` + `CHPortalAccessGuard portal="bank"` + `ChAppShell`/`ChTopbar`/`ChSidebar` | `app/(forge)/credit-hub/bank/layout.tsx:9-11`, `components/credit-hub/bank/BankChShell.tsx` |
| Roles admitidos | banker, bank_analyst, bank_admin, compliance_officer, credit_admin, tenant_admin, platform_superadmin, admin | `lib/credit-hub/auth/portal-access.ts:28-37` |
| Bloqueo de escritura | `chFetch` bloquea los métodos que modifican datos si el rol en localStorage es `viewer` | `lib/credit-hub/api/client.ts:285` |
| Cliente HTTP | `chFetch`, ruta relativa → BFF `app/api/v2/[[...path]]/route.ts:43` → `${BACKEND_URL}/api/v2/<path>`; envía `X-Tenant-ID` y `X-Actor-Role` | `lib/credit-hub/api/client.ts:55,279` |
| Marca | `useTenantConfig` (deprecado) → branding del tenant. Mientras carga o si falla: "Institución financiera", DOP, "RD$", es-DO | `lib/credit-hub/hooks/useTenantConfig.ts:159-164` |
| Moneda | `chMoney` = `"RD$"` + `toLocaleString("es-DO")`, **fija**; no lee `currency` del tenant | `lib/credit-hub/ch-base.ts:51-59`, `lib/credit-hub/utils/currency.ts:2-4` |
| Menú propio | `ChSidebar` lista Panel, Bandeja, Analítica, Auditoría y Cumplimiento. **Escalaciones y Vehículos no aparecen** | `components/credit-hub/shell/ChSidebar.tsx:30-50` |
| Insignias visibles | "REAL / DEMO / ROADMAP" en mayúsculas en muchas tarjetas | `components/credit-hub/honesty/DataTruthBadge.tsx:19-22` |
| Banner demo | "MODO DEMO — Datos de demostración" si `tenantConfig.is_demo` | `app/(forge)/credit-hub/CreditHubLayoutClient.tsx:14-18` |

### 1.1 Pantallas del portal banco

| # | Pantalla (menú) | Ruta | Endpoints del backend | Datos | Textos técnicos o errores visibles |
|---|---|---|---|---|---|
| B-1 | **Mesa de decisiones** | `/credit-hub/bank` → `BankDashboardView` | `GET /api/v2/credit/applications/queue` · `GET /api/v2/credit/analytics/dashboard?period=30d` · `GET /api/v2/credit/bank/kpis/portfolio` · `GET /api/v2/credit/bank/kpis/approval` · `GET /api/v2/credit/goals/monthly/{yyyy-mm}` · `GET /api/v2/credit/analytics/risk-distributions` · `GET /api/v2/credit/analytics/auction-intel` | **MIXTO**. Fijos: `stipulationsCount = 0` (`BankDashboardView.tsx:46`), "Sincronizado hace unos minutos" (`:59`), alertas de `BankDecisionQueueSpotlight.tsx:65-73`. Productividad por analista = "Próximamente". Banner DEMO si el nombre de la institución contiene "demo" o "nadakki" (`BankDashboardView.tsx:48-49`) | "Objetivos DEMO — revisar pacing del mes", "Asignación de analista ROADMAP" (`BankDecisionQueueSpotlight.tsx:68,72`) · "Adverse action · cumplimiento ECOA / Reg B" (normativa de EE. UU., `RiskCreditPanel.tsx:44`) · "El endpoint auction-intel aún no está disponible…", "Win rate", "Look-to-book", "no expone win_rate_breakdown" (`AuctionIntel.tsx:65,74,84,119`) · "no devolvió cohort_analysis", "en analytics/dashboard" (`BankAnalystProductivity.tsx:60,104`) |
| B-2 | **Bandeja** | `/credit-hub/bank/applications` → `BankApplicationsTable` | `GET …/applications/queue?limit&offset&q` · `POST …/applications/bulk-decide` · `GET /api/v2/credit/bank/export/queue.xlsx` (fetch directo) | **REAL**. La acción masiva lleva la regla fija `APROBAR_SCORE_GTE_800` y `analystId: user?.id ?? "unknown"` (`applications/page.tsx:76-81`) | UUID `application_id` bajo el nombre (`bank/shared/bankUi.tsx:355`) · prioridad como enum crudo (`bankUi.tsx:63`) · toast `Error ${status}` / `err.detail` (`BankApplicationsTable.tsx:104,115`) |
| B-3 | Detalle de solicitud | `/credit-hub/bank/applications/[applicationId]` → `BankDetailLayout` + `BankApplicationOpsPanel` | `GET …/applications/{id}/expediente/full` (con fallback a `GET …/applications/{id}`) · `GET /api/v2/credit/compliance/{id}` · `GET …/{id}/events` · `POST …/{id}/claim` → `POST …/{id}/decide` · `GET …/{id}/counter-offer` · `GET …/{id}/offers/compare` · notas, asignación, amortización y condiciones · `POST …/offers/check-expiry` · `PUT …/offers/{offerId}/expiry` · `GET`/`POST …/stipulations[/{sid}/clear]` · `POST …/identity/liveness` | **REAL**. Tasa por defecto 17.5 fija si falta (`BankDetailLayout.tsx:200`). `console.log` de diagnóstico (`page.tsx:16-31`) | UUID en la cabecera (`BankDetailLayout.tsx:239`) · "RFC", término mexicano (`:240`) · `Error ${status}: ${detail}` (`:185`) · en el panel de operaciones: `offer_status` y estado de estipulación crudos, `checked_at` en ISO, etiquetas `pad_score`, `provider`, `requires_manual_review` con true/false, `err.message` directo, "Error HTTP ${status}" (`BankApplicationOpsPanel.tsx:59-428`, `_lib/ops-actions-api.ts:64`) |
| B-4 | Escalaciones (fuera del menú) | `/credit-hub/bank/escalations` → `EscalationsList` | `GET /api/v2/credit/notifications`, filtrado en el cliente | **REAL** si `NEXT_PUBLIC_CH_NOTIFICATIONS=true` (apagado por defecto) | "Notificaciones no disponibles — activa NEXT_PUBLIC_CH_NOTIFICATIONS." (`EscalationsList.tsx:29`) · "PENDING_MANUAL_REVIEW" (`:47`) · "deshabilitado (flag)" (`:25`) · "Sin endpoint de listado dedicado en OpenAPI v5.4.4." (`escalations/page.tsx:16`) |
| B-5 | Historial de vehículos | `/credit-hub/bank/vehicles` (vista dentro de la página) | `GET /api/v2/credit/vehicles/vin/{vin}/anomalies` | **REAL**, consulta bajo demanda | Etiquetas `vin`, `anomaly_count` (`vehicles/page.tsx:114,118`) · `{type} · {severity}` crudos (`:17`) · "Payload completo" con `JSON.stringify` (`:21-23`) · `err.message` (`:54`) |
| B-6 | Analítica / reportes | `/credit-hub/bank/analytics` → `BankAnalyticsView` | `GET …/analytics/dashboard?period=30d` · `GET …/analytics/dealers-ranking` · `GET …/analytics/portfolio-health` | **REAL**, pero el selector 7d/30d/90d/YTD **no vuelve a pedir datos**: siempre 30d (`BankAnalyticsView.tsx:18,49`, `useBankAnalytics.ts:8`). El cliente envía `actorRole: "bank_admin"` fijo (`bankClient.ts:229,236,243`) | "Analytics & Intelligence Executive" (`:41`) · "motor {rule}" crudo (`:47`) · "Top dealers" (`:126`) · "El endpoint portfolio-health aún no expone score_distribution…" (`PortfolioHealthGrid.tsx:21`) |
| B-7 | Cumplimiento | `/credit-hub/bank/compliance` → `BankComplianceView` | `GET …/applications/queue?limit=50` + N × `GET /api/v2/credit/compliance/{id}` | **MIXTO**. "Solicitudes en cola" y "RTBF pendientes" fijos en "—" (`BankComplianceView.tsx:44-45`); sección RTBF de relleno (`:79-81`) | "Compliance & Trust Layer" (`:33`) · `severity` y `rule` crudos (`:58,62`) · UUID como texto del enlace (`:67`) · "Placeholder — endpoint RTBF no expuesto en MVP" (`:79`) |
| B-8 | Auditoría (hub) | `/credit-hub/bank/audit` → `BankAuditView` | `GET …/applications/queue?limit=50` + N × `GET …/applications/{id}/events` | **REAL** ("no synthetic events", `audit/page.tsx:7`) | Acciones fuera de `A_LABEL` crudas (`BankAuditView.tsx:77,117`) · actor como id o rol crudo (`:118`) · detalles `{k}: {v}`, p. ej. "decision: APPROVED" (`:124`) · UUID como enlace (`:132`) |

### 1.2 Pantallas del lado banco fuera de `/credit-hub/bank/**`

| # | Pantalla (menú) | Ruta | Endpoints | Datos | Textos técnicos o errores visibles |
|---|---|---|---|---|---|
| B-9 | **KPIs de banco** | `/credit/bank/kpis` (vista en la página; cabecera "COPIA SIN ENLACE" aunque está enlazada) | `GET /api/v2/credit/bank/kpis/lenders` · `GET /api/v2/credit/bank/kpis/trends` · `GET /credit/dashboard/summary` (rewrite `next.config.js:388`) | **REAL**. Guardia: solo `CreditTenantGate` (`:655`), sin control de rol | "Error HTTP {status}" (`:133`), `e.message` (`:137`) · códigos de lender crudos en el eje X (`:483`) · `toLocaleString()` sin locale (`:246`) |
| B-10 | **Configuración → Filtros de pool** | `/credit/pool-filters` (vista en la página) | `GET`/`PUT`/`DELETE /api/v2/credit/pool-filters` | **REAL**. Guardia: solo `CreditTenantGate` | "Error HTTP {status}" (`:38`), `err.message` (`:138,186,219`) · `lender_code` crudo (`:271`) · placeholder `"new \| used"` (`:294`) · "Monto mínimo/máximo" sin moneda (`:311-312`) |
| B-11 | Compliance (root) | `/compliance` | `GET /api/catalog/compliance/agents` | **Inalcanzable**: redirect permanente `/compliance` → `/credit-hub` (`next.config.js:235`). El ítem del menú aterriza en la portada. Si se llegara, los KPIs son fijos ("5", "99.5%", "< 1s") | "HTTP {status}", `err.message`, "Precision" sin tilde |
| B-12 | Bandeja (vieja) | `/credit/bank/queue` | — | Redirige a `/credit-hub/bank/applications` si `NEXT_PUBLIC_BANK_PILOT_UI` está activo (valor por defecto). Huérfana | Con el flag apagado: "…(NEXT_PUBLIC_BANK_PILOT_UI=off)." |
| B-13 | Analítica de cartera (vieja) | `/bank/analytics` → `BankPortfolioDashboard` | `GET …/analytics/risk-distributions` · `GET …/analytics/auction-intel` · `GET /credit/dashboard/summary` **con `actorRole:"dealer"`** | **REAL**. Guardia del lado cliente con `localStorage nadakki_role`, falsificable (`lib/bank/analytics-api.ts:22-49`). Huérfana | "Bank analytics fetch failed: …" · "BANK_ANALYST o BANK_ADMIN con encabezado X-Role" · "NEXT_PUBLIC_FEATURE_BANK_ANALYTICS=true", `nadakki_role` |
| B-14 | Detalle (viejo) | `/bank/applications/[id]` y `/stipulations` | `GET …/applications/{id}` · `POST …/claim` · `POST …/decide` · estipulaciones verify, reject y create | **REAL**. Sin guardia de cliente. Huérfana | Volcado JSON de `last_process_result` (`page.tsx:297`) · UUID completo · enums crudos · "(http_{status})" · enlace "Volver a la bandeja" → `/bank/applications/queue`, que no existe (`page.tsx:189,207,233`) · respaldo `currency==="DOP"?"DOP":"USD"` (`ApplicationHeader.tsx:11`) |
| B-15 | Laboratorio en tiempo real | `/workflow-real` | `GET …/applications/queue?page=1&limit=50` + WebSocket `NEXT_PUBLIC_WS_URL` | **REAL**; si falla devuelve `[]` en silencio. Huérfana | "Activa NEXT_PUBLIC_FEATURE_REALTIME_UPDATES=true…", "(mock o cola vacía)", `queue_fetch_failed`, UUID en toasts |
| B-16 | Dashboard operativo | `/credit/dashboard` | `GET /credit/dashboard/summary` | **REAL**. Huérfana | **Interfaz entera en inglés** ("Operational Dashboard", "Total Applications", "Offers by Lender"…), enums crudos, `toLocaleString()` sin locale |
| B-17 | Activación de la institución | `/credit-hub/activacion/{configuracion,credenciales,readiness}` | `GET`/`PUT /api/v2/institucion/configuracion[/{blockId}]` · `GET`/`POST`/`DELETE /api/v2/institucion/credenciales[/{id}[/probar]]` · `GET /api/v2/institucion/readiness` · `GET /api/v2/institucion/production-gates` | **REAL**. Sin guardia de cliente (`bank_admin` es solo un header que el cliente pone él mismo). Huérfanas | Editor JSON crudo "Datos de configuración (JSON)" · "PASS/FAIL", "ACTIVE", "Production readiness", "Gates de producción" · `err.message` |
| B-18 | Métricas de banco (monetización) | `/credit-hub/monetizacion/metricas-banco` | `GET /api/v2/monetizacion/metricas-banco/{tenantId}` | **MIXTO**: tenant fijo `"banco-cibao"` (`page.tsx:7`); con la API activa solo `tenant_id`, `plan` y `decisions` son reales, el resto es fixture (`adapter.ts:200-207`) | "Vista white-label… tenant switcher" · `formatRd` = "RD$ " + `toLocaleString("en-US")` |
| B-19 | Monetización (menú, BETA) | `/credit-hub/monetizacion/dashboard` | `GET /api/v2/monetizacion/dashboard` | **MIXTO o DEMO**. Con `NEXT_PUBLIC_FM_USE_API≠"true"` todo sale de fixtures, y la guarda `mockOnly` solo lanza error si `production && USE_API`, combinación que nunca se da (`lib/credit-hub/monetizacion/adapter.ts:44-48`). Deltas fijos "+12.4%" etc. | "Backend en modo degradado (FF_REAL_* off)" · "Fuente: {data_source}" · "Take rate", "MRR", "GMV" |

### 1.3 Pantallas del menú de Credit Hub que son del portal dealer

Están en el mismo menú (Acceso / Solicitudes), pero las protege `CHPortalAccessGuard portal="dealer"` (`components/credit-hub/dealer/DealerChShell.tsx:124-125`). Pasarlas al shell del banco **cambiaría permisos**, así que se inventarían pero quedan fuera del plan B (ver §4.4).

| # | Pantalla | Ruta | Endpoints | Datos | Textos técnicos o errores visibles |
|---|---|---|---|---|---|
| D-1 | Dealer | `/credit-hub/dealer` | `GET …/applications` · `GET …/stats` · `GET /credit/dashboard/summary` · `GET …/analytics/banks-ranking` · `GET …/goals/monthly/{p}` · `GET /credit/applications/{id}/offers` | **MIXTO**: `demoTrend=[3,4,5,6,7,8]` (`elite/DealerKpiStrip.tsx:66,78`); "Documentos solicitados" = `pendingOffers+2` y "Estipulaciones" = `+3`, cifras fabricadas (`elite/DealerPipelineRail.tsx:105-106`); alerta fija "67% … (objetivos DEMO)" | "El endpoint /credit/dashboard/summary no está disponible… datos locales o DEMO." (`DealerDashboardView.tsx:103,108`) · RD$ fijo en `ApplicationCard.tsx:96,144` |
| D-2 | Nueva solicitud | `/credit-hub/dealer/applications/new` → `/new/applicant` | `POST …/applications`, `…/{id}/applicant`, `…/{id}/vehicle` · `POST …/multi-lender/execute` · `PATCH …/{id}/fields` | **REAL** | "Credit Core request timed out/failed" (`creditCoreClient.ts:34,94,96`), `JSON.stringify(detail)` (`:32`), `err.message` |
| D-3 | Preaprobación | `/credit-hub/dealer/preapproval` | Ninguno (cálculo local con `scenario-engine`), solo branding | Cálculo local con parámetros del tenant o los valores por defecto de RD | `Intl.NumberFormat("es-DO",{currency:"DOP"})` fijo (`SimulatorResults.tsx:22`) aunque la página recibe `currency` |
| D-4 | Dealer — listado | `/credit-hub/dealer/applications` | `GET …/applications` | **REAL** | Ninguno relevante; moneda del tenant o "—" |

### 1.4 Resumen del inventario

- **Datos fijos en pantallas principales:** Mesa de decisiones (B-1), Cumplimiento (B-7), Dealer (D-1), Monetización (B-18, B-19). Las demás pantallas piden todo al backend.
- **Textos técnicos visibles:** en todas las pantallas del banco. Patrones repetidos: `err.message` / "Error HTTP {status}" crudos, UUID visibles, enums sin traducir, nombres de variables de entorno y de endpoints, términos de EE. UU. o México (ECOA / Reg B, RFC) en una interfaz para RD.
- **Moneda:** el banco no lee la moneda del tenant; RD$/es-DO están fijos en `chMoney`. Correcto para RD, pero no viene del tenant.
- **Rutas huérfanas o rotas:** B-11 (inalcanzable), B-12 a B-17. Escalaciones y Vehículos no están en el menú propio del banco.

---

## 2. Sistema visual del dealer: qué se reutiliza

Fuente: `components/dcc/*`, `lib/dcc/*`, `components/dealer-management/shell/*`.

| Pieza | Archivo (LOC) | Dependencia del dealer | Veredicto | Qué cambiar |
|---|---|---|---|---|
| Tokens claro/oscuro (marino/dorado/turquesa) | `lib/dcc/tokens.ts` (121): `DCC_TOKENS`, `dccThemeStyle` | Ninguna; variables `--dcc-*` en línea sobre la raíz | **Tal cual** | — |
| Raíz y contexto de tema | `components/dcc/DccThemeRoot.tsx` (13), `DccThemeContext.tsx` (23) | Ninguna (`data-dcc-root`, `data-dcc-theme`) | **Tal cual** | El tema vive en memoria y se pierde al recargar; no es un hueco del banco |
| DccTarjeta | `components/dcc/DccCard.tsx` (52), exporta `DccCard` | Ninguna | **Tal cual** | El nombre real es `DccCard` |
| DccSeccion | `components/dcc/DccSeccion.tsx` (47) | Ninguna | **Tal cual** | — |
| DccEstado, DccTooltip, DccHeader | `components/dcc/*.tsx` | Ninguna (`DccHeader` recibe marca y tema por props) | **Tal cual** | — |
| Sello de calidad | `components/dcc/SelloCalidad.tsx` (51), `lib/dcc/calidad.ts` (79) | Ninguna | **Tal cual** | — |
| DccKpi, DccKpiTile | `components/dcc/DccKpi.tsx` (25), `DccKpiTile.tsx` (51) | Indirecta: `DCC_CLASSES.cifra` usa `font-dealer-numeric`, que solo existe bajo `[data-portal="dealer"]` (`app/globals.css:1022`) | **Tal cual, con matiz** | Fuera del dealer la cifra no sale en mono; se resuelve con `clases.ts` |
| Clases | `components/dcc/clases.ts` (19) | `font-dealer-numeric` (`:16`) | **Generalizar (poco)** | Clase numérica neutra ligada a un token `--dcc-font-numeric` de la raíz DCC |
| DccPage / DccGrid | `components/dcc/DccPage.tsx` (42) | `useDealerManagementBranding` (`:6,23`) | **Generalizar** | `marca` por prop opcional; sin prop, comportamiento actual del dealer. `DccGrid` ya vale tal cual |
| Marca | `lib/dcc/marca.ts` (32), `lib/dcc/producto.ts` (8) | Firma fija "con Nadakki Dealer OS" | **Generalizar** | Firma por producto (`dealer` / `banco`) como parámetro. La firma del banco es una decisión de César (§4.4) |
| Formato del tenant | `lib/dcc/formato.ts` (84) | Importa `localeDeTenant` de `lib/dealer-management/formato.ts:15` | **Generalizar (poco)** | Llevar `localeDeTenant` a `lib/dcc`. Normalizar `es_DO` → `es-DO`: hoy un tag con guion bajo lanza `RangeError` en `Intl` y nada lo captura |
| DealerShell (ítem activo dorado) | `components/dealer-management/shell/DealerShell.tsx` (316), `DealerSidebar.tsx` (299; ítem activo en `:81`), `DealerTopbar.tsx` (156; conmutador de tema en `:118`) | Contexto y capabilities del dealer, `data-portal="dealer"`, `DCC_PRODUCTO.firma`, breadcrumbs y rutas `/autos/dealer` | **Generalizar a fondo** | Extraer un shell de presentación (grupos de menú, firma, breadcrumbs y acciones por props); el contexto del dealer se queda en su envoltorio |
| Tema del shell | `components/dealer-management/shell/dealer-shell-theme.ts` (42) | Solo el nombre | **Tal cual (cambiar nombre)** | Mapea `--nav-*`, `--bg` y `--brand` a `--dcc-*` |
| Tenant activo | `components/dealer-management/shell/DealerTenantActivo.tsx` (44) | Ninguna (`/auth/me`) | **Tal cual (cambiar nombre)** | — |
| Menú, inicio, reportes | `dealer-nav.ts`, `lib/dcc/inicio.ts`, `lib/dcc/reportes.ts` | Rutas y endpoints del dealer | **Solo dealer** | El banco necesita su propio menú y su propio cargador |
| Fuentes locales | `components/dealer-management/shell/DealerFonts.ts`: Sora, IBM Plex Sans y IBM Plex Mono con `next/font/local` | `dealerFontVariables` (`:41`) **no se importa en ningún sitio** (grep sin resultados); las reglas de `app/globals.css:1010-1024` solo aplican bajo `[data-portal="dealer"]` | **Generalizar** | Hoy el dealer hereda Inter del `body` (por lectura de código; no se comprobó en navegador). Para el banco: cargar las variables en la raíz DCC del shell |

**Formato del tenant y es-DO / DOP.** El branding sale de `GET /api/v2/tenants/{tenant_id}/branding`: la ruta del backend recibe un UUID (`routers/tenant_branding_router.py:118`) y devuelve `locale` (por defecto `es-DO`) y `currency` (por defecto `DOP`) (`schemas/tenant_branding.py:90-91`). Los dos hooks del frontend llaman con el UUID del tenant. El comentario "keys by slug" de `useTenantConfig.ts:126-127` está desactualizado: el hook ignora el slug (`lib/credit-hub/hooks/useTenantBranding.ts:12`). `formatMoneda` y `formatMonedaCompacta` devuelven `null` sin moneda, y la tarjeta muestra "Próximamente". Resultados en Node con `es-DO`/`DOP`: `RD$1,234.50`, `RD$182.4 M`, `06/10/2026`.

**Tests existentes a conservar:** `components/dcc/tests/*` (3), `lib/dcc/tests/*` (8, entre ellos `lamina`, que compara con `DCC_TOKENS_LAMINA.html`, y `contraste`), `components/dealer-management/shell/tests/dealer-shell-theme.test.tsx`, `app/autos/dealer/{inicio,reportes}-v2/tests/*`.

**Lo que las -v2 del banco dejan de usar:** tokens `--ch-*` (piedra y ámbar, acento banco `#2F4A6B`, sin modo oscuro) de `app/credit-hub/credit-hub.css`; primitivas Forge de `components/credit-hub/primitives/*` (`--forge-*`, oscuro por `[data-theme]`); estados `CHEmptyState`, `CHErrorState` y `CHLoadingState`; insignias `DataTruthBadge`. Los clientes HTTP y hooks de datos (`lib/credit-hub/api/*`, `lib/credit-hub/hooks/*`) **se reutilizan sin cambios**.

---

## 3. Endpoints para un "Command Center del banco"

Identidad del banco en el backend: el tenant sale de `auth.tenant_id` (JWT) y, dentro del tenant, el banco es un `lender_code` resuelto por `user_lender_assignments` (`services/credit/ownership.py:71,212`). El aislamiento por lender está detrás de un flag apagado por defecto (`ownership.py:163`). Los permisos son listas de roles dentro de cada handler; no hay entitlements.

Convención de calidad (N6): `{metric_key, value, unit, quality:{status: VERIFICADA|PARCIAL|NO_DISPONIBLE, covered, total}, reasons}`. Hoy solo está implementada para el dealer (`services/autos_portal/dealer_metrics.py:52-65`). **Ningún endpoint del banco devuelve `quality`.**

| Capacidad | Lo que existe (referencia) | Lo que falta | Endpoint propuesto |
|---|---|---|---|
| **Cola de decisión por SLA y score** | `GET /api/bank/applications/queue?sort_by=sla_priority`: ordena por `(hours_until_sla, -score)` (`services/bank/queue_service.py:204-205`; router `routers/bank/applications_queue_router.py:101`). SLA **fijo en código**: 24 h pending y 72 h reviewing (`queue_service.py:38-39`), medido desde `created_at`. Tope interno de 500 filas (`:32`). La segunda cola, `GET /api/v2/credit/applications/queue` (`routers/credit_router.py:694`), es la que usa el frontend: ordena por score y luego antigüedad, **sin SLA** | SLA configurable por tenant o lender con su origen; `sla_deadline` y `sla_status` (en tiempo / en riesgo / vencido); medir desde el envío y no desde `created_at`; `risk_level`/`priority` en la cola con SLA; monto con moneda; `quality`; un solo criterio de visibilidad entre las dos colas | Extender `GET /api/bank/applications/queue` con `sla_deadline`, `sla_hours_remaining`, `sla_status`, `sla_policy{hours, source}`, `score`, `risk_level`, `priority`, `requested_amount{value,currency}`, `submitted_at`, `quality` |
| **Embudo recibidas → evaluadas → ofertadas → aceptadas → desembolsadas** (fondeado = `DISBURSED`) | Foto por estado: `GET /api/v2/credit/bank/kpis/portfolio` (`routers/credit/bank_kpi_router.py:30`) y `GET /credit/dashboard/summary` (`routers/credit/dashboard_router.py:53`). `GET /api/v2/credit/bank/kpis/trends` cuenta como "funded" `OFFER_SELECTED`, `COMPLETED`, `DISBURSED` y `READY_FOR_DISBURSEMENT` (`services/credit/bank_kpi_service.py:231`), en contra de D-N6-3. `DISBURSED` tiene un único escritor, `services/credit/disbursement_service.py:267` | El endpoint de embudo; filtros `from`/`to` y `lender_code`; fondeado = `DISBURSED`; monto desembolsado con moneda; `quality` | `GET /api/v2/credit/bank/kpis/funnel?from&to&lender_code&cohort=created_at` → `stages[{key: received\|evaluated\|offered\|accepted\|disbursed, count, conversion_from_prev}]`, `disbursed_amount`, `currency`, `quality`, `as_of`. Corregir `trends` para que use solo `DISBURSED` |
| **Tiempo de respuesta frente al SLA** | `avg_response_hours` en `GET /api/v2/credit/bank/kpis/approval` (`bank_kpi_router.py:42`): solo promedio, contra `oferta.created_at`, incluye ofertas automáticas (`bank_kpi_service.py:127-138`). `avg_decision_time_hours` en `GET /api/v2/credit/analytics/dashboard` **siempre `None`** (`services/credit/bank/bank_analytics.py:104`) | Mediana y p90; % dentro del SLA; origen del SLA; par canónico de eventos de inicio y fin; filtros | `GET /api/v2/credit/bank/kpis/response-time?from&to&lender_code` → `median_hours`, `p90_hours`, `within_sla_pct`, `sample_size`, `sla_policy`, `start_event`, `end_event`, `quality`, `as_of` |
| **Red de dealers** | `GET /api/v2/credit/analytics/dealers-ranking` (`credit_router.py:815`) y `top_dealers` en el dashboard: clave de dealer tomada del payload y no de `credit_applications.dealer_id` (`bank_analytics.py:30-38`), corte silencioso a 500 filas, top 10 fijo, sin monto, periodo ni desembolsos | Agregación SQL por `dealer_id` con nombre, solicitudes, aprobadas, desembolsadas, monto, tiempo de respuesta; paginación; `quality` | `GET /api/v2/credit/bank/dealers?from&to&lender_code&sort=volume\|approval_rate\|disbursed` → filas `{dealer_id, dealer_name, applications, decided, approved, approval_rate, disbursed_count, disbursed_amount, avg_response_hours, rank}`, `currency`, `quality` |
| **Motivos de rechazo** | `rejection_reasons` en `GET /api/v2/credit/analytics/risk-distributions` (`routers/credit/risk_analytics_router.py:50`), leídos de `credit_decision_snapshots` del scoring (`services/credit/analytics/risk_distributions.py:118-160`). Los `reason_codes` del analista en `/decide` (mínimo 1, `services/bank/decision_types.py:81`) se guardan en `payload.decision_ep13` y en el evento `DECISION_RENDERED` (`services/bank/decision_service.py:580-607`), **no en snapshots**: el endpoint actual no ve los motivos del banco | Persistencia consultable de los motivos del banco; catálogo de códigos con etiqueta; `pct`; periodo y lender; `quality` | `GET /api/v2/credit/bank/kpis/decline-reasons?from&to&lender_code&source=bank\|system\|all` → `reasons[{reason_code, label, count, pct}]`, `total_declines`, `source`, `quality`, `as_of` |

**Dependencia común: marcas de tiempo.** `credit_applications` solo tiene `created_at`/`updated_at`. No hay `submitted_at`, `decided_at`, `accepted_at` ni `disbursed_at` como columnas. Hay eventos en `application_events` (`APPLICATION_RECEIVED`, `BANK_DECISION_MADE`, `DECISION_RENDERED`, `OFFER_ACCEPTED`, `DISBURSEMENT_RECORDED`) y fechas dentro del payload, pero no un evento genérico de cambio de estado. `DISBURSED`, `READY_FOR_DISBURSEMENT`, `CANCELLED` y `EXPIRED` se escriben por SQL fuera de la máquina de estados (`services/credit/workflows/state_machine.py:8-33`). El embudo por cohorte de `created_at` se puede hacer hoy; el tiempo de respuesta, uniendo eventos y con `quality = PARCIAL` donde falten.

**Moneda.** Solo `GET /api/v2/credit/bank/kpis/portfolio` declara moneda, y es `"DOP"` fijo (`bank_kpi_service.py:83`). Según N6, la moneda canónica es la funcional de la entidad legal (`services/contable/functional_currency.py:29`), no la del branding. Ver la decisión D-B3 en §4.4.

**Riesgos del backend a corregir antes de construir encima** (no son parte del plan B):
1. `GET /api/v2/credit/bank/kpis/*` solo exige `require_auth`, **sin rol**: un usuario dealer del mismo tenant puede leerlos (`bank_kpi_router.py`).
2. La analítica de `credit_router` se corta en 500 filas sin avisar.
3. Hay dos colas con criterios de visibilidad distintos.
4. `GET /api/v2/credit/analytics/banks-ranking` solo admite dealers (`routers/credit/analytics_router.py:49`); si el banco lo necesitara, habría que abrirlo.

---

## 4. Plan B1–B4 (GR-12: ≤ 500 LOC y ≤ 2 directorios por PR)

**Reglas comunes a los cuatro PR:**
- **Misma funcionalidad y mismos permisos.** Las -v2 usan los mismos clientes y hooks (`lib/credit-hub/api/*`, `lib/credit-hub/hooks/*`), las mismas guardias (`CHTenantGuard` + `CHPortalAccessGuard portal="bank"`) y las mismas acciones. Por ejemplo, la acción masiva sigue con la regla actual: cambiarla es otra conversación.
- **Rutas nuevas sin romper las actuales.** Todo vive en `app/(forge)/credit-hub/bank-v2/**`. No puede ir bajo `bank/` porque `bank/layout.tsx` impone `BankChShell` y un layout hijo no puede quitarlo. Ninguna ruta actual cambia ni redirige. El menú global solo enlaza las -v2 cuando César lo decida (D-B1).
- **Moneda y formato del tenant.** Importes y fechas con `lib/dcc/formato.ts` usando `locale` y `currency` del branding (por defecto en el backend: `es-DO` / `DOP`). Sin moneda configurada no se pinta ningún importe; la tarjeta muestra "aún no disponible" con su sello, como en el dealer. `chMoney` (RD$ fijo) no se usa en -v2.
- **Textos llanos.** Nada de `err.message`, "Error HTTP", UUID, enums crudos, nombres de variables de entorno ni endpoints. Los estados se traducen con los mapas que ya existen (`STATE_LABEL` en `lib/credit-hub/bank/bankFormat.ts:12-20`). Los errores muestran "No pudimos cargar … · Reintentar".
- **Sin cifras inventadas.** Donde no hay endpoint (§3), la tarjeta dice "aún no disponible" con `SelloCalidad`, en lugar de las alertas fijas "DEMO/ROADMAP" de hoy.
- **Antes de cada push:** `npx eslint` sobre los archivos tocados (el script `npm run lint` solo cubre una lista fija de archivos), `npm run typecheck` y los Jest del directorio tocado. Los tests DCC del dealer (§2) siguen en verde.
- **Etiquetas:** sin `dash-mapaal-*`.

| PR | Contenido | Directorios (≤ 2) | LOC estimadas | Criterio de aceptación |
|---|---|---|---|---|
| **B1** — DCC sin dependencia del dealer | `formato`: `localeDeTenant` pasa a `lib/dcc` y se normaliza `es_DO` → `es-DO`. `marca`: firma por producto (`dealer` / `banco`). `DccPage`: `marca` por prop opcional; sin prop se comporta igual que hoy. `clases`: clase numérica neutra con token `--dcc-font-numeric` en `dccThemeStyle`. Tests de `es-DO`/`DOP`, `es_DO` y moneda ausente | `lib/dcc`, `components/dcc` | ~250 | El dealer se ve igual (tests DCC en verde, incluidas lámina y contraste); `formatMoneda(…, "es-DO", "DOP")` da `RD$…`; `es_DO` no lanza error |
| **B2** — Shell DCC genérico + esqueleto `bank-v2` | Shell de presentación `components/dcc/shell/*` (sidebar con ítem activo dorado, topbar con conmutador de tema, tenant activo y fuentes locales en la raíz), con grupos, firma y breadcrumbs por props. `app/(forge)/credit-hub/bank-v2/layout.tsx` con las **mismas guardias** que `BankChShell` y su menú (`_nav.ts`): los ítems sin -v2 apuntan a las rutas actuales, así nada queda inalcanzable. `DealerShell` **no se toca** en esta serie (su migración al shell genérico sería un PR aparte) | `components/dcc`, `app/(forge)/credit-hub/bank-v2` | ~450 | Un rol no bancario recibe el mismo rechazo que en `/credit-hub/bank`; tema claro/oscuro; ítem activo dorado; test del layout con guardias |
| **B3** — Mesa de decisiones v2 + Bandeja v2 | `/credit-hub/bank-v2` (Mesa): KPIs de `kpis/portfolio`, `kpis/approval` y `analytics/dashboard`, cola de la Bandeja y metas, con `DccKpiTile` y sello; las tarjetas del Command Center sin endpoint (§3) aparecen como "aún no disponible". `/credit-hub/bank-v2/solicitudes` (Bandeja): misma consulta, paginación, búsqueda, exportación y acción masiva, con estados traducidos, sin UUID y con monto en la moneda del tenant | `app/(forge)/credit-hub/bank-v2`, `components/credit-hub/bank-v2` | ~480 | Mismas llamadas al backend que la versión actual (test con el cliente simulado); sin textos técnicos (test que busca "Error HTTP", UUID y "DEMO"); importes en `DOP`/`es-DO` desde el branding |
| **B4** — Detalle de solicitud v2 | `/credit-hub/bank-v2/solicitudes/[applicationId]`: expediente, cumplimiento, eventos, reclamar y decidir, contraoferta, comparar ofertas y estipulaciones, con las mismas condiciones (`can("create_decision")` + dueño del claim). Sin UUID ni enums crudos ni "RFC"; sin tasa 17.5 inventada ("aún no disponible" si falta); sin `console.log` | `app/(forge)/credit-hub/bank-v2`, `components/credit-hub/bank-v2` | ~500 (en el límite) | Mismas acciones y permisos que la versión actual; textos llanos; si supera 500 LOC se parte en B4a (lectura) y B4b (acciones) |

### 4.1 Lo que no cabe en B1–B4

Analítica, KPIs de banco, Cumplimiento, Auditoría, Filtros de pool, Escalaciones y Vehículos (B-4 a B-10) no caben en cuatro PR de ≤ 500 LOC. Mientras tanto, el menú de `bank-v2` los enlaza en su versión actual. Propuesta, sujeta a D-B2:
- **B5:** Analítica v2 + KPIs de banco v2.
- **B6:** Cumplimiento + Auditoría + Filtros de pool + Escalaciones + Vehículos v2.

### 4.2 Lo que no es rediseño (arreglos aparte, P1)

Salieron al inventariar y **no** entran en B, para no mezclar cambios de funcionalidad con el rediseño:
- Backend: control de rol en `bank/kpis/*`.
- Backend: `trends` con fondeado = `DISBURSED`.
- Monetización: guarda `mockOnly` invertida.
- Ítem "Compliance (root)" que redirige a la portada.
- Enlace roto "Volver a la bandeja" en `/bank/applications/[id]`.
- Selector de periodo de Analítica que no hace nada.
- `actorRole:"dealer"` en `/bank/analytics`.

### 4.3 Endpoints de backend que desbloquean el Command Center

Los cinco de §3, en este orden de valor por esfuerzo:
1. Funnel por cohorte de `created_at` (se puede hacer hoy).
2. Motivos de rechazo con la fuente del banco.
3. Red de dealers por SQL.
4. SLA configurable en la cola.
5. Tiempo de respuesta, que depende de las marcas de tiempo.

Ninguno bloquea B1–B4: hasta que existan, las tarjetas muestran "aún no disponible".

### 4.4 Decisiones pendientes (César)

| Id | Qué hay que decidir | Opción A · qué se pierde | Opción B · qué se pierde |
|---|---|---|---|
| D-B1 | Cuándo el menú global de Credit Hub apunta a `bank-v2` | Al cerrar B4 · el banco convive unas semanas con dos estéticas según la pantalla | Al cerrar B6 · más tiempo sin que los usuarios vean el rediseño |
| D-B2 | Ampliar la serie a B5–B6 | Sí · dos PR más de revisión | No · Analítica, Cumplimiento y Auditoría se quedan con la estética actual |
| D-B3 | Fuente de la moneda en el banco | `branding.currency` (ya disponible, DOP por defecto) · puede no coincidir con la moneda funcional contable de N6 | Moneda funcional de la entidad legal (N6) · hace falta exponerla al frontend antes de B3 |
| D-B4 | Firma del producto en el shell del banco | Una propia, p. ej. "con Nadakki Credit Hub" · hay que fijar el texto | Ninguna · se pierde coherencia con el dealer |
| D-B5 | Pantallas del portal dealer dentro del menú de Credit Hub (D-1 a D-4) | Fuera de esta serie · siguen con la estética actual | Dentro, con su propio shell -v2 de dealer · otra serie de PR, porque moverlas al shell del banco cambiaría permisos |
