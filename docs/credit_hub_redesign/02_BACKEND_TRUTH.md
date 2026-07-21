# 02 · BACKEND TRUTH — Inventario REAL de endpoints del Credit Hub

> Auditoría SOLO LECTURA. Backend `nadakki-ai-suite` (FastAPI). Producción `https://nadakki-ai-suite.onrender.com`, tenant `nadakki-demo`.

## Cómo se obtuvo esta verdad (honestidad sobre el método)

1. **Probe HTTP real** contra producción con header `X-Tenant-ID: nadakki-demo` (sin token).
   Resultado: **todos los endpoints de datos devuelven `401 Unauthorized`** (requieren `Authorization: Bearer`).
   No dispongo de un token JWT del tenant, por lo que **no pude leer los bodies en runtime**.
   El `401` (en vez de `404`) **confirma que el endpoint EXISTE** y está montado.
2. **OpenAPI en vivo** (`/openapi.json`, 818 KB): las respuestas de crédito están declaradas como
   `object` **sin propiedades** (FastAPI devuelve `dict` sin `response_model`), así que el OpenAPI
   **NO documenta los campos**. Solo `/credit/applications/{id}/offers` tiene tipo (`OffersResponse`).
3. **Código fuente del backend** (`C:\Users\ramon\Projects\nadakki-ai-suite`): fuente de verdad
   real de los campos. Los nombres de campo de abajo se leyeron de los handlers (file:line citados).

> Conclusión del método: los **nombres de campo** vienen del código del backend (autoritativo);
> los **status** vienen del probe real. No están inventados.

---

## Probe de existencia (status reales, sin token)

| Método | Path | Status real | Lectura |
|---|---|---|---|
| GET | `/api/v2/credit/stats` | **401** | EXISTE (requiere auth) |
| GET | `/api/v2/credit/applications` | **401** | EXISTE |
| GET | `/api/v2/credit/applications/queue` | **401** | EXISTE |
| GET | `/api/v2/credit/analytics/dashboard?period=30d` | **401** | EXISTE |
| GET | `/api/v2/credit/analytics/dealers-ranking` | **401** | EXISTE |
| GET | `/api/v2/credit/analytics/portfolio-health` | **401** | EXISTE |
| GET | `/credit/applications/{id}/offers` | **401** | EXISTE |
| GET | `/api/v2/credit/applications/{id}/offers` | **401** | EXISTE (shape legacy) |
| GET | `/api/v2/credit/applications/{id}/counter-offer` | **401** | EXISTE |
| GET | `/api/v2/credit/compliance/{id}` | **401** | EXISTE |
| GET | `/api/v2/credit/applications/{id}/audit-trail` | **401** | EXISTE |
| GET | `/api/v2/credit/analytics/banks-ranking` | **404** | **NO EXISTE** |
| GET | `/api/v2/credit/auction-intel` | **404** | **NO EXISTE** |

---

## Tabla maestra: endpoint · campos reales · ¿lo consume el front?

### Dealer / núcleo

#### `GET /api/v2/credit/stats` — REAL (agregado de DB)
`credit_router.py:290` → `orchestrator.py:1056` → `persistence_db.py:782`.
Campos que devuelve **de verdad**:
- `total_applications` (suma de todos los buckets de `states`)
- `states` → `{ "<STATUS>": count }` (snapshot actual por columna `status`: `DRAFT`, `RECEIVED`, `AI_ANALYSIS`, `AI_COMPLETE`, `BANK_SUBMITTED`, `BANK_COMPLETE`, `HYBRID_IN_PROGRESS`, `OFFER_SELECTED`, `COMPLETED`, `FAILED`)
- `modes` → `{ "AI_ONLY", "BANK_ONLY", "HYBRID", ... }`
- `approval_rate` (float | null)
- `avg_score` (float | null) ← **OJO: es `avg_score`, NO `average_score`**
- `note` (solo si `total_applications == 0`), `trace_id`

**NO devuelve:** `submitted_applications`, `processing_applications`, `applications_this_week`, `average_score`.
El front consume `/api/v2/credit/stats` vía `useCreditStats` y **sintetiza** esos campos con
`normalizeStats()` (`lib/credit-hub/api/normalizers.ts:208`). **AQUÍ NACE EL "763":**

```221:223:lib/credit-hub/api/normalizers.ts
  const submitted = pickNumber(record, ["submitted_applications", ...])
    ?? (stateSum(states, "SUBMITTED", "BANK_SUBMITTED", "COMPLETED", "BANK_COMPLETE", "PROCESSED")
    || countStatus(sourceApps, ["submitted", "processed"]));
```

`stateSum` **incluye `COMPLETED`** en "submitted". En `nadakki-demo`, `states.COMPLETED ≈ 758`, así que
`submitted_applications ≈ 763` → `activeCount = submitted + processing ≈ 763`. El KPI "Solicitudes
activas" muestra **763** porque cuenta las COMPLETADAS como activas. (Ver `03_SCREEN_DATA_MAP.md`.)

#### `GET /api/v2/credit/applications` — REAL (lista de DB)
`credit_router.py:270` → `orchestrator.py:1009`. Top-level: `applications[]`, `total`, `tenant_id`, `trace_id`.
Campos por item (**fix A2/#411 SÍ está en el backend**, `orchestrator.py:1035-1048`):
- `application_id` ✅
- `state` ✅ (**no `status`**)
- `mode`, `dry_run`, `has_result`, `events_count`, `created_at`
- `applicant_name` ✅ (de `payload.applicant.full_name|name`)
- `vehicle_make` ✅, `vehicle_model` ✅, `vehicle_year` ✅ (de `payload.vehicle`)
- `requested_amount` ✅ (de `payload.financial`)
- **NO**: `updated_at`, `score`

> Es decir: el fix de nombre/vehículo **SÍ llegó al endpoint que el front consume**. Si en producción
> se ven UUIDs en vez de nombres, es porque se está sirviendo un **bundle viejo** (pre-A2), no porque
> el dato falte (ver `01_RENDER_TRUTH.md` §6).

#### `GET /credit/applications/{id}/offers` — REAL (Cap 11, prefijo `/credit`)
`offers_router.py:82`. Único endpoint **tipado** en OpenAPI (`OffersResponse`).
Top-level: `application_id`, `tenant_id`, `offers[]`, `pagination {limit, offset, total}`.
Campos por oferta (`OfferRow`, `offers_router.py:29-41`):
- `id`, `application_id`, `tenant_id`, `created_at`
- `interest_rate_apr` (APR), `term_months` (plazo), `monthly_payment` (cuota), `amount_approved` (monto)
- `lender_code` ← **no `lender_name`**
- `status` (inglés: `approved|pending|declined|counter_offer|accepted|not_selected`)
- **Estipulaciones: NO están top-level** en `OfferRow` (existen en DB `terms` pero no se mapean).

> El normalizador del front (`normalizeOffer`, `normalizers.ts:291`) es tolerante: lee también
> el shape **legacy Model A** (`/api/v2/credit/applications/{id}/offers`) con `lender_name`,
> `apr_annual`, y `terms.stipulations`. Es decir el front soporta DOS shapes de oferta.

### Banco

#### `GET /api/v2/credit/applications/queue` — REAL
`credit_router.py:302` → `bank_decision_engine.py:337`. Top-level: `applications[]`, `total` (⚠️ = `len(página)`, no total de DB), `tenant_id`, `trace_id`.
Campos por item (`bank_decision_engine.py:349-364`): `application_id`, `tenant_id`, `state`,
`applicant_name`, `dealer_id`, `dealer_name`, `vehicle_label` (= `"año make model"`),
`requested_amount`, `score`, `risk_level`, `approval_band`, `priority` (`ALTA|MEDIA|BAJA`, computado),
`created_at`, `bank_decision`.

#### `GET /api/v2/credit/applications/{id}` — REAL (detalle banco)
`applications_detail_router.py:85` → `detail_service.py:84`. Top-level: `application_id`, `tenant_id`,
`state`, `created_at`, `queue_status`, `borrower_name_masked` (**enmascarado**), `events_count`,
`recent_events[]`, `application_payload` (blob completo), `last_process_result`, `bank_claim`, `trace_id`, `correlation_id`.
`applicant`/`vehicle`/`financial` viven DENTRO de `application_payload`.

#### `GET /api/v2/credit/applications/{id}/full` — REAL (dossier dealer)
`credit_router.py:760` → `dealer_service.py:160`. Top-level: `tenant_id`, `application_id`, `state`,
`application`, `applicant`, `vehicle`, `ai_decision`, `offers`, `events`, `trace_id`.
`ai_decision`/`analysis`: `score`, `risk_level`, `approval_band`, `payment_capacity`,
`estimated_payment`, `financed_amount`, `dti`, `factors`, `positive_factors`, `negative_factors`,
`recommendations`, `explanation`, `confidence`, `metrics`.

#### `GET /api/v2/credit/applications/{id}/counter-offer` — REAL (reglas)
`credit_router.py:540` → `bank_decision_engine.py:222`. Top-level: `application_id`, `score`,
`original_terms`, `counter_offer_terms`, `rate_adjustment_bps`, `explanation`, `generated_at`, `trace_id`, `tenant_id`.
`*_terms`: `approved_amount`, `interest_rate`, `term_months`, `down_payment_required`, `conditions[]`.

#### `GET /api/v2/credit/applications/{id}/audit-trail` — REAL
`credit_router.py:522` → `bank_compliance.py:70`. Top-level: `application_id`, `has_analysis`,
`has_bank_decision`, `events[]`, `event_count`, `audited_at`, `trace_id`, `tenant_id`.
`events[]` item: `event`, `timestamp`, `by` (+ `decision` en `BANK_DECISION_MADE`).
Tipos conocidos: `ANALYSIS_COMPLETED`, `BANK_REVIEW_STARTED`, `BANK_DECISION_MADE`. (Lista vacía si nunca se pobló.)

#### `GET /api/v2/credit/compliance/{id}` — REAL (Ley 172-13)
`credit_router.py:558` → `bank_compliance.py:52`. Top-level: `application_id`, `ley_172_13_compliant`,
`consent_data_processing`, `consent_bureau_authorization`, `consent_terms_accepted`,
`consents_complete`, `documents_complete`, `data_retention_policy`, `right_to_be_forgotten`,
`issues[]` (`type`, `severity`, `action_required`), `generated_at`, `version`, `framework`, `trace_id`, `tenant_id`.

#### `GET /api/v2/credit/analytics/dashboard` — REAL (tope 500 apps)
`credit_router.py:338` → `bank_analytics.py:41`. Top-level: `applications_by_status`,
`approval_rate`, `avg_decision_time_hours` (**siempre `null`**, placeholder), `top_dealers[]`,
`portfolio_value`, `default_prediction`, `cohort_analysis[]`, `total_applications`, `trace_id`, `tenant_id`.
`top_dealers[]`: `{ dealer, volume, approved, approval_rate }`.
`default_prediction`: `{ rule, predicted_default_count, predicted_default_rate }`.
`cohort_analysis[]`: `{ period, applications, approved, approval_rate }`.

#### `GET /api/v2/credit/analytics/portfolio-health` — REAL (`score_distribution` SÍ)
`credit_router.py:363` → `bank_analytics.py:120`. Top-level: `portfolio_value`, `default_prediction`,
**`score_distribution`** (`{ "800+", "700-799", "600-699", "<600", "sin_score" }` enteros), `generated_at`, `trace_id`, `tenant_id`.

#### `GET /api/v2/credit/analytics/dealers-ranking` — REAL (per-DEALER, no per-banco)
`credit_router.py:352` → `bank_analytics.py:116`. Top-level: `dealers[]`, `trace_id`, `tenant_id`.
`dealers[]`: `{ dealer, volume, approved, approval_rate }`.

---

## Datos que EXISTEN y se pueden mostrar REAL

- KPIs dealer crudos: `total_applications`, `states{}` (por etapa), `avg_score`, `approval_rate`.
- Lista de solicitudes con `applicant_name`, `vehicle_make/model/year`, `requested_amount`, `state`.
- Ofertas por solicitud: APR (`interest_rate_apr`/`apr_annual`), `term_months`, `monthly_payment`, `amount_approved`, banco (`lender_code`/`lender_name`), `status`. (Estipulaciones solo en shape legacy `terms.stipulations`.)
- Bandeja banco completa (nombre/dealer/vehículo/monto/score/risk/priority).
- Detalle banco + dossier dealer (`/full`) con análisis IA real.
- Counter-offer (términos por reglas), audit-trail, compliance (Ley 172-13).
- Analítica banco: dashboard, **portfolio-health con `score_distribution`**, ranking de **dealers**.

## Datos que NO existen (NO diseñar como real)

- **`/analytics/banks-ranking` → 404.** No hay analítica per-banco (aprobación/APR/tiempo por lender).
  El componente `BankRanking` del dealer es **DEMO hardcodeado** (`DEMO_BANKS`).
- **`/auction-intel` → 404.** No hay "auction intel" / subasta de bancos.
- **Metas/objetivos del dealer:** no hay endpoint. `DealerGoals` usa targets ilustrativos (DEMO).
- **Notificaciones:** no hay endpoint; el front las **deriva** de la lista de solicitudes
  (`notificationsFromApplications`, `dealerFormat.ts:121`, marcado `TODO`).
- **`avg_decision_time_hours`:** el endpoint lo devuelve pero **siempre `null`** (placeholder).
- **`updated_at` y `score` en la lista de solicitudes:** no vienen (el front cae a `created_at` y `score=null`).
- **Estipulaciones en el comparador moderno (`OfferRow`):** no se mapean top-level (solo en shape legacy).

## Notas de discrepancia para el rediseño

1. **`stats` (agregado de TODA la DB) vs `applications` (lista paginada).** Los KPIs salen de un
   universo (todo el tenant) y las tarjetas/“en curso” de otro (página actual) → números no cuadran.
2. **`state` (backend) vs `status` (front).** El front mapea con `mapBackendState` (`normalizers.ts:59`).
3. **Dos shapes de oferta** (`OfferRow` moderno con inglés / Model A legacy con español + `terms`).
4. **`total` de la queue** = tamaño de página, no total real de DB (paginación engañosa).
