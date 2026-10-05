# DCC — Tarjeta → endpoint (huecos para la fase 3 del backend)

Fuente de diseño: `docs/design/DCC_REFERENCIA_v3.html` (#624).
Fuente de métricas y reportes: `docs/decisions/N6_N7_METRIC_REGISTRY_Y_REPORTES.md` (nadakki-ai-suite, firmado 2026-10-04).
Estado del frontend: FASE R1 (#627, #628, #629, #630).

Regla: el frontend no calcula fórmulas financieras ni inventa cifras. Donde no hay endpoint, la tarjeta muestra **"aún no disponible"** con su sello. Cada fila de "falta endpoint" es trabajo de backend.

Medición: rutas y campos verificados leyendo el código de nadakki-ai-suite (archivo:línea abajo). El montaje (L3) se toma de la medición de N6/N7 (`app.openapi()` en `80d20dc`); en esta sesión **no** se volvió a ejecutar `app.openapi()`.

## Command Center (`/autos/dealer/inicio-v2`)

| Tarjeta (referencia v3) | metric_key | Endpoint que la alimenta hoy | Estado R1 | Qué falta en el backend |
|---|---|---|---|---|
| Inventario · unidades en stock | `inventory_units@1.0` | `GET /api/v1/autos/dealers/{dealer_id}/vehicles` (`routers/autos_portal_router.py:509`) — lista; el conteo disponible+reservado (D-N6-1) se arma sobre la lista | Conectada · **parcial** | Conteo por dealer filtrado por stock, con `quality` en la respuesta |
| Leads | `lead_count@1.0` | `GET /api/v1/autos/tenants/{t}/dealers/{d}/leads` → `total` (`autos_portal_router.py:678`) | Conectada · **verificado** (histórico) | Filtro de período; `quality` en la respuesta |
| Financiamiento · solicitudes | `financing_applications@1.0` | `GET /api/v2/credit/applications` → `total`, filtrado por dealer (`routers/credit_router.py:654`) | Conectada · **verificado** (histórico) | Filtro de período; `quality` en la respuesta |
| Capital en inventario | `inventory_capital@1.0` | — (solo por vehículo: `/vehicles/{id}/costs/total`) | **Falta endpoint** | Σ costo total del stock por dealer + cobertura n/m de unidades con `purchase` |
| Días en inventario | `inventory_age_days@1.0` | — (solo por vehículo: `/vehicles/{id}/days`) | **Falta endpoint** | Promedio y máximo por dealer; el importador no escribe `vehicle_acquisitions` |
| Margen potencial / ingreso potencial | `potential_revenue@1.0` · `gross_margin@1.0` | — | **Falta endpoint** | Σ precio de lista del stock; margen potencial con linaje y cobertura n/m |
| Margen bruto del mes (y %) | `gross_margin@1.0` · `gross_margin_pct@1.0` | — (solo por vehículo: `/vehicles/{id}/margin`) | **Falta endpoint** | Agregado dealer × mes; ventas por PATCH no crean `vehicle_sales` (D-N6-2) |
| Tiempo de respuesta a leads | `lead_response_time@1.0` | — | **Falta endpoint** | Mediana de primer contacto; `new → qualified` no marca contacto |
| Conversión de leads | `lead_conversion_rate@1.0` | — | **Falta endpoint** | Tasa calculada en el backend (el frontend no divide) |
| Ofertas listas | `financing_offers_ready@1.0` | — (solo por tenant: `bank_kpi_service.py:64`) | **Falta endpoint** | Conteo por `dealer_id` usando `display_status.py` |
| Conversión a fondeo | `finance_conversion_rate@1.0` | — | **Falta endpoint** | Conteo por dealer de `status = 'DISBURSED'` (D-N6-3) |
| Caja / Cobranzas | — (no está en N6) | — | **Falta métrica y endpoint** | Definir la métrica en el registry y su capability |
| Hoy · actividad reciente | — | — (no hay feed de actividad del dealer) | **Falta endpoint** | Feed de eventos del dealer con tenancy |
| Brief del día (atención / oportunidades / riesgo) | — | — | **Falta endpoint** | Motor de reglas sobre métricas versionadas que devuelva conteos y textos |
| Cola de atención (umbral de días, lead sin contacto, costos incompletos) | — | — | **Falta endpoint** | Lista priorizada con umbral, recomendación y evidencia, calculada en el backend |
| Salud operativa (cobertura 26/27, estado por área) | — | — | **Falta endpoint** | Cobertura por área y global calculada en el backend |
| Insights | — | — | **Falta endpoint** | Reglas sobre métricas versionadas con evidencia y sello |
| Reportes e inteligencia (favoritos, programados) | — | — | **Falta endpoint** | Persistencia de favoritos y reportes programados |

## Centro de Reportes (`/autos/dealer/reportes-v2`)

| Elemento (referencia v3) | Endpoint hoy | Estado R1 | Qué falta en el backend |
|---|---|---|---|
| Catálogo de ReportDefinitions (key, naturaleza LIVE/SNAPSHOT) | — (el catálogo es el inventario firmado de N7, como metadatos en el frontend) | Listado sin cifras | Registro de ReportDefinitions servido por el backend |
| Balance de Comprobación + "Explicar cifra" | `GET /api/v1/contable/balance-comprobacion` → `total_debe`, `total_haber`, `cuadra`, `cuentas` (`routers/contable/asientos_router.py:653-684`) | Conectado · **parcial** (no declara moneda) | Moneda funcional en la respuesta; snapshot de cierre; `quality` |
| Estado de Resultados, Balance General, Flujo de Caja, Presupuesto vs Real, Libro Diario, Libro Mayor | Endpoints de N7 (solo filas, sin totales) | Listados, sin cifras | Totales y desglose calculados en el backend; bloqueantes de N7 |
| DGII 606 / 607 | Endpoints de N7 (SNAPSHOT) | Listados, sin cifras | Conciliación (N7) |
| Reporte Ejecutivo | `GET /api/v1/reports/executive` | Listado, sin cifras | Es de pipeline de marketing, no de dealer: un ejecutivo de dealer sería un reporte nuevo |
| Visor de reporte (capital >45 d, vs período anterior, vs objetivo, rotación, tramos de antigüedad) | — | **Falta endpoint** | `inventory_aging` como reporte con tramos, comparativos y objetivos |
| Linaje del cálculo, cobertura n/m, "fuera del cálculo", fuentes | — | **Falta endpoint** | Cada métrica debe devolver linaje, cobertura y fuentes |
| Exportar PDF / XLSX / CSV, guardar, programar | — | **Falta endpoint** | Export y programación servidos por el backend |

## Marca y acceso

| Elemento | Fuente | Nota |
|---|---|---|
| Nombre y logo del dealer | `GET /api/v2/tenants/{id}/branding` (`display_name`, `logo_url`) | Del tenant |
| "con Nadakki Dealer OS" | Constante del producto (`lib/dcc/producto.ts`) | Decisión de César: marca del producto, no del tenant |
| Locale y moneda | `branding.locale`, `branding.currency` | Sin moneda configurada no se pinta ningún importe |
| Accesos | `GET /api/v1/access/entitlements/batch` | `/auth/me` no devuelve capabilities; el acceso lo decide el backend vía entitlements |
| Usuario y saludo ("Buen día, Carolina") | `GET /api/v2/auth/me` → `user.name` | Disponible; no conectado en R1 |
