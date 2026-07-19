# BACKEND DEFECTS LEDGER — Legal Core

**Propósito:** Registro reproducible de defectos backend que **no** se workarouean en UI.  
**Tenant de prueba:** Nadakki Demo `d3b00111-0000-0000-0000-000000d3b001`  
**Backend vivo:** `https://nadakki-ai-suite.onrender.com/api/v1/legal`  
**Auditoría:** 2026-07-19 (Invoke-RestMethod / Invoke-WebRequest desde Windows)

> Input planificado para trabajo backend legal post-M1. Cada fila incluye request exacto y respuesta cruda.

---

## BD-001 — `POST /cases/{id}/archive` no existe (404)

| Campo | Valor |
|-------|--------|
| **Endpoint** | `POST /api/v1/legal/cases/{case_id}/archive` |
| **Clasificación matriz** | ROTO #2 |
| **UI consumidora** | `/legal/cases/[id]/archive` → `legal-cases-api.ts:346` |
| **Comportamiento esperado (spec)** | Archivar expediente con auditoría |
| **Comportamiento real** | `404 {"detail":"Not Found"}` |

**Request reproducible:**

```powershell
$tenant = "d3b00111-0000-0000-0000-000000d3b001"
Invoke-WebRequest -Method POST `
  -Uri "https://nadakki-ai-suite.onrender.com/api/v1/legal/cases/01c38444-e89b-4d1a-90cd-f2ed4fcc4a3a/archive" `
  -Headers @{ "X-Tenant-ID" = $tenant; "Content-Type" = "application/json" } `
  -Body '{"reason":"probe"}' -UseBasicParsing
```

**Respuesta:** `404` — `{"detail":"Not Found"}`

**UI (regla 5):** Mostrar error honesto; no simular éxito. Alternativa de archivo no inventada.

---

## BD-002 — `POST .../verify_extracted_data` no existe (404)

| Campo | Valor |
|-------|--------|
| **Endpoint** | `POST /api/v1/legal/cases/{case_id}/documents/{document_id}/verify_extracted_data` |
| **Clasificación matriz** | ROTO #3 |
| **UI consumidora** | `/legal/cases/[id]/documents` → `legal-cases-api.ts:221` |
| **Comportamiento esperado (spec)** | Confirmar/corregir datos OCR extraídos |
| **Comportamiento real** | `404 {"detail":"Not Found"}` |

**Request reproducible:**

```powershell
Invoke-WebRequest -Method POST `
  -Uri "https://nadakki-ai-suite.onrender.com/api/v1/legal/cases/c3f52c77-3353-4369-96bb-eb1f88fad70d/documents/00000000-0000-0000-0000-000000000001/verify_extracted_data" `
  -Headers @{ "X-Tenant-ID" = "d3b00111-0000-0000-0000-000000d3b001"; "Content-Type" = "application/json" } `
  -Body '{"verified":true}' -UseBasicParsing
```

**Respuesta:** `404` — `{"detail":"Not Found"}`

---

## BD-003 — `GET .../snapshots/verify` enrutado como `{snapshot_id}` (500)

| Campo | Valor |
|-------|--------|
| **Endpoint** | `GET /api/v1/legal/cases/{case_id}/snapshots/verify` |
| **OpenAPI** | Declarado como `verify_snapshot_chain` |
| **Comportamiento esperado** | Verificación de cadena de integridad de snapshots |
| **Comportamiento real** | FastAPI resuelve `verify` como UUID de snapshot → SQL error |

**Request reproducible:**

```powershell
Invoke-WebRequest -Method GET `
  -Uri "https://nadakki-ai-suite.onrender.com/api/v1/legal/cases/c3f52c77-3353-4369-96bb-eb1f88fad70d/snapshots/verify" `
  -Headers @{ "X-Tenant-ID" = "d3b00111-0000-0000-0000-000000d3b001" } -UseBasicParsing
```

**Respuesta:** `500` — `invalid UUID 'verify'` en query `WHERE snapshot_id = $1`

**Causa probable:** Orden de rutas — `{snapshot_id}` captura antes que `/verify`.

---

## BD-004 — `GET .../snapshots/diff` enrutado como `{snapshot_id}` (500)

Misma causa que BD-003.

**Request:**

```powershell
Invoke-WebRequest -Method GET `
  -Uri "https://nadakki-ai-suite.onrender.com/api/v1/legal/cases/c3f52c77-3353-4369-96bb-eb1f88fad70d/snapshots/diff?snapshot_id_a=x&snapshot_id_b=y" `
  -Headers @{ "X-Tenant-ID" = "d3b00111-0000-0000-0000-000000d3b001" } -UseBasicParsing
```

**Respuesta:** `500` — `invalid UUID 'diff'`

---

## BD-005 — `POST /cases/{id}/actors` falla por columna faltante (500)

| Campo | Valor |
|-------|--------|
| **Endpoint** | `POST /api/v1/legal/cases/{case_id}/actors` |
| **Comportamiento esperado** | Agregar actor al expediente |
| **Comportamiento real** | `500` — `column "identification_number_hmac" of relation "legal_case_actors" does not exist` |

**Request reproducible:**

```powershell
$body = '{"actor_kind":"persona_fisica","full_name":"Actor Post","role":"cliente","is_primary":true,"conflict_check_done":false,"conflict_detected":false}'
Invoke-WebRequest -Method POST `
  -Uri "https://nadakki-ai-suite.onrender.com/api/v1/legal/cases/01c38444-e89b-4d1a-90cd-f2ed4fcc4a3a/actors" `
  -Headers @{ "X-Tenant-ID" = "d3b00111-0000-0000-0000-000000d3b001"; "Content-Type" = "application/json" } `
  -Body $body -UseBasicParsing
```

**Nota:** Bug relacionado con actores en wizard (`initial_actors` en POST `/cases` devuelve `actors: []` en 201).

---

## Desviaciones de contrato (frontend adaptado — no defect)

### DEV-001 — Acciones disponibles embebidas en GET case (no endpoint dedicado)

| FE legacy | Producción real |
|-----------|-----------------|
| `GET /cases/{id}/available_actions` → 404 | `GET /cases/{id}` incluye `available_actions: string[]` y `allowed_transitions: string[]` |

**Evidencia:** GET case 200 incluye `"available_actions":["upload_document","generate_strategies"]`.

**Fix FE (PR-2):** `fetchAvailableActions` lee GET case; no llama path fantasma.

### DEV-002 — Ejecutar acción: body `{ action, actor_type, payload }` en `POST /cases/{id}/actions`

| FE legacy | Producción real |
|-----------|-----------------|
| `POST .../actions/{action_name}` → 404 | `POST .../actions` con body `{ "action": "...", "actor_type": "human" \| "agent" \| "system", "payload": {} }` |

**Evidencia:** `POST .../actions` + `{ action: "generate_strategies", actor_type: "human" }` → **200**.

**Spec Fase 2** decía `{action_name}` en path — backend se desvió. FE adaptado al contrato vivo.

### DEV-003 — Transiciones de estado vía `PATCH /cases/{id}/state`

`allowed_transitions` no se ejecutan como POST action en estado TRIAGE (`409`).  
`PATCH /cases/{id}/state` con `{ new_state, reason }` → **200**.

---

## Índice rápido

| ID | Severidad | Endpoint | Fix owner |
|----|-----------|----------|-----------|
| BD-001 | Alta | POST archive | Backend M1+ |
| BD-002 | Media | POST verify_extracted_data | Backend M1+ |
| BD-003 | Alta | GET snapshots/verify | Backend (route order) |
| BD-004 | Alta | GET snapshots/diff | Backend (route order) |
| BD-005 | Alta | POST actors | Backend (migration) |
| DEV-001 | — | available_actions | Frontend ✅ PR-2 |
| DEV-002 | — | POST actions | Frontend ✅ PR-2 |
| DEV-003 | — | state transitions | Frontend ✅ PR-2 |
