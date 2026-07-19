# LEGAL UI COVERAGE MATRIX — Fase 0 (read-only)

**Auditoría:** 2026-07-19  
**Backend vivo:** `https://nadakki-ai-suite.onrender.com/openapi.json`  
**Frontend:** `csorianoai/nadakki-dashboard` @ rama `feat/legal-full-ui-coverage`  
**Proxy BFF:** `/api/legal/*` → `${BACKEND}/api/v1/legal/*` (`next.config.js:326-327`)  
**Tenant de prueba:** Nadakki Demo `d3b00111-0000-0000-0000-000000d3b001`

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|------:|
| Endpoints OpenAPI (`/api/v1/legal/*`, método+path) | **95** |
| CONSUMIDO_REAL | **41** |
| CONSUMIDO_PARCIAL | **10** |
| HUÉRFANO | **43** |
| ROTO (path FE ≠ OpenAPI o endpoint fantasma) | **4** |

---

## Reproducción ROTO en producción (2026-07-19)

Tenant header: `X-Tenant-ID: d3b00111-0000-0000-0000-000000d3b001`  
Case probe: `c3f52c77-3353-4369-96bb-eb1f88fad70d` (demo create: `01c38444-e89b-4d1a-90cd-f2ed4fcc4a3a`)

| # | Endpoint FE legacy | Request real | Status | Body (resumen) | Clasificación | Acción PR-2 |
|---|-------------------|--------------|--------|----------------|---------------|-------------|
| 1 | `GET .../available_actions` | `GET /cases/{id}/available_actions` | **404** | `{"detail":"Not Found"}` | **FRONTEND_FIXABLE** | Leer `available_actions` desde `GET /cases/{id}` (200, campo embebido) |
| 2 | `POST .../archive` | `POST /cases/{id}/archive` | **404** | `{"detail":"Not Found"}` | **BACKEND_DEFECT** (BD-001) | UI error honesto; ledger |
| 3 | `POST .../verify_extracted_data` | `POST .../documents/{doc}/verify_extracted_data` | **404** | `{"detail":"Not Found"}` | **BACKEND_DEFECT** (BD-002) | UI error honesto; ledger |
| 4a | `POST .../actions/{name}` | `POST .../actions/advance_to_intake` | **404** | `{"detail":"Not Found"}` | **FRONTEND_FIXABLE** | Usar `POST .../actions` body `{action, actor_type, payload}` |
| 4b | (contrato vivo) | `POST .../actions` + `{action:"generate_strategies", actor_type:"human"}` | **200** | Estrategias generadas | **FRONTEND_FIXABLE** | Adaptar FE al contrato vivo (DEV-002) |

**Desviaciones adicionales (no contadas en ROTO×4):**

| Endpoint | Status | Clasificación | Ledger |
|----------|--------|---------------|--------|
| `GET .../snapshots/verify` | **500** | BACKEND_DEFECT | BD-003 |
| `GET .../snapshots/diff` | **500** | BACKEND_DEFECT | BD-004 |
| `POST .../actors` | **500** | BACKEND_DEFECT | BD-005 |
| `PATCH .../state` | **200** | FRONTEND_FIXABLE | DEV-003 (transiciones UI) |

Ledger completo: [`BACKEND_DEFECTS_LEDGER.md`](./BACKEND_DEFECTS_LEDGER.md)

---

| Métrica (cont.) | Valor |
|-----------------|------:|
| Rutas `/legal/*` en repo | **24 páginas** |
| Rutas `/legal/*` en producción (`dashboard.nadakki.com`) | **200 OK** en todas las verificadas |

### Hallazgos críticos (prioridad Fase 1)

1. **ROTO — acciones de expediente:** FE llama `GET .../available_actions` y `POST .../actions/{name}`; OpenAPI expone solo `POST .../actions` (sin GET de acciones disponibles).
2. **ROTO — archivar:** FE llama `POST .../archive`; endpoint **no existe** en OpenAPI vivo.
3. **ROTO — verify_extracted_data:** FE llama `POST .../verify_extracted_data`; endpoint **no existe** en OpenAPI vivo.
4. **CONSUMIDO_PARCIAL — snapshots/verify y diff:** UI simula verificación on-chain client-side; no consume `GET .../snapshots/verify` ni `GET .../snapshots/diff`.
5. **HUÉRFANO — bloques completos:** `flujos/*` (11), `validation-queue/*` (7), `attorneys/*` (4), `notifications/preferences` (2), `export/pdf`, `cases/search`, `strategies/generate`, related link/detect/unlink, disaster-mode admin ops.
6. **GR-14 disclaimer:** `LegalDisclaimerFooter` es **descartable** (`sessionStorage`) y **ausente** en `/legal/research` (layout fullscreen). Incumple regla “no removible”.
7. **Badges honestidad:** Research/contracts no muestran sistemáticamente `MOCK` / `DRAFT — NO CERTIFICADO` según spec v1.0.
8. **Banner S3 documentos:** no implementado en `/legal/cases/[id]/documents` (deuda Fase 1 PR-5).

### Producción vs repo

Verificación HTTP (2026-07-19, `fetch` sin auth):

| Ruta | Prod | Repo |
|------|:----:|:----:|
| `/legal` | 200 | ✓ |
| `/legal/cases` | 200 | ✓ |
| `/legal/cases/new` | 200 | ✓ |
| `/legal/research` | 200 | ✓ |
| `/legal/audit` | 200 | ✓ |
| `/legal/config` | 200 | ✓ |
| `/legal/contracts` | 200 | ✓ |
| `/legal/onboarding` | 200 | ✓ |
| `/legal/audiencias` | 200 | ✓ |
| `/legal/strategies/historical` | 200 | ✓ |
| `/legal/guide` | 200 | ✓ |
| `/legal/cases/{id}/issues` | 200 | ✓ |
| `/legal/cases/{id}/snapshots` | 200 | ✓ |
| `/legal/cases/{id}/archive` | 200 | ✓ |

**Discrepancia:** ninguna ruta legal verificada existe solo en repo; producción sirve las mismas rutas. El gap es **consumo de API**, no despliegue de páginas.

---

## Inventario frontend (rutas + hooks)

### Rutas `app/(forge)/legal/`

| Ruta | Página |
|------|--------|
| `/legal` | Home + TaskLauncher |
| `/legal/research` | Consulta legal (agent run) |
| `/legal/contracts` | Quick-check contratos |
| `/legal/cases` | Lista expedientes |
| `/legal/cases/new` | Wizard creación |
| `/legal/cases/[id]` | Detalle + lock release |
| `/legal/cases/[id]/documents` | Upload, lifecycle, generación IA |
| `/legal/cases/[id]/timeline` | Eventos + decision_trace |
| `/legal/cases/[id]/deadlines` | Plazos + override |
| `/legal/cases/[id]/issues` | Incidencias |
| `/legal/cases/[id]/risk` | Perfil de riesgo |
| `/legal/cases/[id]/snapshots` | Versiones + verify local |
| `/legal/cases/[id]/strategy` | Estrategias + select |
| `/legal/cases/[id]/related` | Expedientes relacionados |
| `/legal/cases/[id]/archive` | Archivar (endpoint ROTO) |
| `/legal/audit` | Audit trail |
| `/legal/config` | Knowledge pack + practice areas |
| `/legal/audiencias` | Calendario audiencias |
| `/legal/onboarding` | Onboarding firma |
| `/legal/guide` | Guía interna |
| `/legal/strategies/historical` | Comparador estrategias |

### Hooks legales (`hooks/legal/`, `hooks/useLegal*.ts`)

`useLegalCase`, `useLegalCases`, `useCaseActions`, `useCaseTimeline`, `useCaseDeadlines`, `useCaseIssues`, `useCaseRisk`, `useCaseSnapshots`, `useCaseLock`, `useCaseRelated`, `useCaseStrategies`, `useCaseDocuments`, `useCaseDocumentLifecycle`, `useDocumentVersions`, `useDocumentGeneration`, `useDisasterMode`, `useJurisdictions`, `useHearings`, `useStrategyComparison`, `useUpcomingDeadlines`, `useLegalCore` (health/agents/run/audit/knowledge-pack), `useLegalTasks`, `useExecuteLegalTask`, `useLegal` (quick-check legacy audit).

### Clientes API

| Archivo | Prefijo | Alcance |
|---------|---------|---------|
| `lib/legal/cases/legal-cases-api.ts` | `/api/legal` | Expedientes, plazos, docs, snapshots, lock, related, jurisdictions |
| `lib/api/legal.ts` | `/api/legal` | Agents, tasks, audit-trail, health, knowledge-pack |
| `lib/legal-api.ts` | `/api/v1/legal` | quick-check, audit-trail (legacy), knowledge-pack |
| `lib/legal/hearings/hearings-api.ts` | `/api/v1/legal` | Audiencias |

---

## Matriz endpoint → consumidor

**Estados:** `CONSUMIDO_REAL` | `CONSUMIDO_PARCIAL` | `HUÉRFANO` | `ROTO`  
Evidencia = `archivo:línea` del fetch/hook o anotación verificable.

### Plataforma / consulta

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `quick-check` | POST | `/legal/contracts` | CONSUMIDO_REAL | `hooks/useLegal.ts:31` → `lib/legal-api.ts:126` |
| `audit-trail` | GET | `/legal/audit`, `/legal` (LegalStatusStrip) | CONSUMIDO_REAL | `hooks/useLegalCore.ts:155`; `hooks/useLegal.ts:70` |
| `knowledge-pack/status` | GET | `/legal/config`, `/legal` (LegalStatusStrip) | CONSUMIDO_REAL | `hooks/useLegalCore.ts:194`; `app/(forge)/legal/config/page.tsx:8` |
| `agents` | GET | — (hook sin UI dedicada) | CONSUMIDO_PARCIAL | `hooks/useLegalCore.ts:111` |
| `agents/{agent_id}/run` | POST | `/legal/research`, `/legal` (TaskLauncher) | CONSUMIDO_REAL | `hooks/useLegalCore.ts:228`; `components/legal/LegalResearchClient.tsx:88` |
| `tasks` | GET | `/legal` | CONSUMIDO_REAL | `hooks/useLegalTasks.ts:28`; `components/legal/LegalHomeContent.tsx:26` |
| `tasks/{task_id}/execute` | POST | `/legal` (TaskLauncher) | CONSUMIDO_REAL | `hooks/useExecuteLegalTask.tsx:79` |
| `health` | GET | `/legal` (LegalStatusStrip) | CONSUMIDO_REAL | `hooks/useLegalCore.ts:72`; `components/legal/LegalStatusStrip.tsx:17` |
| `onboarding` | POST | `/legal/onboarding` | CONSUMIDO_REAL | `app/(forge)/legal/onboarding/page.tsx:53` |
| `onboarding/status/{tenant_id}` | GET | — | HUÉRFANO | Sin fetch en repo (grep 2026-07-19) |
| `jurisdictions` | GET | JurisdictionSelector | CONSUMIDO_REAL | `hooks/legal/useJurisdictions.ts:16` |
| `knowledge-pack/jurisdictions` | GET | — | HUÉRFANO | Alias; FE usa `/jurisdictions` |
| `strategies/compare` | GET | `/legal/strategies/historical` | CONSUMIDO_REAL | `hooks/legal/useStrategyComparison.ts:19` |
| `export/pdf` | POST | — | HUÉRFANO | PDF per-doc vía `GET .../documents/{id}/pdf` |
| `meta/disaster-mode` | GET | Banner global | CONSUMIDO_REAL | `hooks/legal/useDisasterMode.ts:10`; `app/providers/DisasterModeProvider.tsx:19` |
| `meta/disaster-mode/actions` | GET | — | HUÉRFANO | Sin consumidor |
| `meta/disaster-mode/force` | POST | — | HUÉRFANO | Sin consumidor (ops admin) |
| `meta/disaster-mode/health-check` | POST | — | HUÉRFANO | Sin consumidor |
| `notifications/preferences` | GET | — | HUÉRFANO | Sin consumidor |
| `notifications/preferences` | PUT | — | HUÉRFANO | Sin consumidor |

### Expedientes — CRUD y sub-recursos

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `cases` | GET | `/legal/cases`, `/legal` | CONSUMIDO_REAL | `hooks/legal/useLegalCases.ts:21` |
| `cases` | POST | `/legal/cases/new` | CONSUMIDO_REAL | `lib/legal/cases/legal-cases-api.ts:82`; `CaseCreateWizard.tsx:105` |
| `cases/{case_id}` | GET | `/legal/cases/[id]` + sub-rutas | CONSUMIDO_REAL | `hooks/legal/useLegalCase.ts:10` |
| `cases/search` | GET | — | HUÉRFANO | Lista usa `GET /cases?filters`, no `/cases/search` |
| `cases/{case_id}/actions` | POST | `/legal/cases/[id]` (CaseActionsMenu) | **ROTO** | FE: `legal-cases-api.ts:112` `POST .../actions/{name}`; OpenAPI: `POST .../actions` |
| `cases/{case_id}/available_actions` | GET | `/legal/cases/[id]` | **ROTO** | `legal-cases-api.ts:98` — **no en OpenAPI** |
| `cases/{case_id}/state` | PATCH | — | HUÉRFANO | Transiciones intentadas vía actions (ROTO) |
| `cases/{case_id}/classification` | PATCH | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/chains/{trigger}` | POST | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/actors` | GET | `/legal/cases/[id]` (CaseActorsPanel) | CONSUMIDO_PARCIAL | Actores embebidos en GET case; endpoint dedicado no llamado. Bug asyncpg `:param` conocido |
| `cases/{case_id}/actors` | POST | `/legal/cases/new` | CONSUMIDO_PARCIAL | `initial_actors` en POST `/cases` (`CaseCreateWizard.tsx:110`), no POST `/actors` |
| `cases/{case_id}/events` | GET | `/legal/cases/[id]/timeline` | CONSUMIDO_REAL | `hooks/legal/useCaseTimeline.ts:10`; `CaseTimeline.tsx:24` (decision_trace) |
| `cases/{case_id}/deadlines` | GET | `/legal/cases/[id]/deadlines` | CONSUMIDO_REAL | `hooks/legal/useCaseDeadlines.ts:11` |
| `cases/{case_id}/deadlines/{deadline_id}/override` | PATCH | `/legal/cases/[id]/deadlines` | CONSUMIDO_REAL | `legal-cases-api.ts:153`; `CaseDeadlineOverrideModal.tsx` |
| `deadlines/upcoming` | GET | DeadlineNotificationBanner | CONSUMIDO_REAL | `hooks/legal/useUpcomingDeadlines.ts:43` |
| `deadlines/{deadline_id}/acknowledge` | POST | DeadlineNotificationBanner | CONSUMIDO_PARCIAL | `hooks/legal/useUpcomingDeadlines.ts:51` |
| `cases/{case_id}/strategies` | GET | `/legal/cases/[id]/strategy` | CONSUMIDO_REAL | `hooks/legal/useCaseStrategies.ts:13` |
| `cases/{case_id}/strategies/generate` | POST | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/strategies/select` | POST | `/legal/cases/[id]/strategy` | CONSUMIDO_REAL | `legal-cases-api.ts:178` |
| `cases/{case_id}/issues` | GET | `/legal/cases/[id]/issues` | CONSUMIDO_REAL | `hooks/legal/useCaseIssues.ts:13` |
| `cases/{case_id}/issues` | POST | `/legal/cases/[id]/issues` | CONSUMIDO_REAL | `hooks/legal/useCaseIssues.ts` (postIssue) |
| `cases/{case_id}/issues/{issue_id}/resolve` | PATCH | `/legal/cases/[id]/issues` | CONSUMIDO_REAL | `legal-cases-api.ts:258` |
| `cases/{case_id}/risk` | GET | `/legal/cases/[id]/risk` | CONSUMIDO_REAL | `hooks/legal/useCaseRisk.ts:10` |
| `cases/{case_id}/related` | GET | `/legal/cases/[id]/related` | CONSUMIDO_REAL | `hooks/legal/useCaseRelated.ts:10` |
| `cases/{case_id}/related/detect` | GET | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/related/link/{related_case_id}` | POST | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/related/unlink/{related_case_id}` | DELETE | — | HUÉRFANO | Sin consumidor |
| `cases/{case_id}/archive` | POST | `/legal/cases/[id]/archive` | **ROTO** | `legal-cases-api.ts:346` — **no en OpenAPI** |
| `cases/{case_id}/lock` | GET | `/legal/cases/[id]` (CaseLockBanner) | CONSUMIDO_PARCIAL | Lock vía `active_lock` en GET case |
| `cases/{case_id}/lock` | POST | `/legal/cases/[id]` | CONSUMIDO_REAL | `hooks/legal/useCaseLock.ts` |
| `cases/{case_id}/lock` | DELETE | `/legal/cases/[id]` | CONSUMIDO_REAL | `legal-cases-api.ts:329`; `cases/[id]/page.tsx:10` |
| `cases/{case_id}/lock/acquire` | POST | — | HUÉRFANO | Duplicado; FE usa `POST /lock` |
| `cases/{case_id}/lock/release` | DELETE | — | HUÉRFANO | Duplicado; FE usa `DELETE /lock` |

### Documentos

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `cases/{case_id}/documents` | GET | `/legal/cases/[id]/documents` | CONSUMIDO_PARCIAL | Docs vía GET case (`legal-cases-api.ts:188`), no endpoint dedicado |
| `cases/{case_id}/documents` | POST | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `legal-cases-api.ts:360`; `useCaseDocuments.ts` |
| `cases/{case_id}/documents/{document_id}/lifecycle` | PATCH | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `hooks/legal/useCaseDocumentLifecycle.ts` |
| `cases/{case_id}/documents/{document_id}/verify_extracted_data` | POST | `/legal/cases/[id]/documents` | **ROTO** | `legal-cases-api.ts:221` — **no en OpenAPI** |
| `cases/{case_id}/documents/{document_id}/pdf` | GET | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `PdfDownloadButton.tsx:19-25` (fetch+blob+createObjectURL) |
| `cases/{case_id}/documents/generate` | POST | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `legal-cases-api.ts:374` |
| `cases/{case_id}/documents/generated` | GET | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `hooks/legal/useDocumentGeneration.ts:20` |
| `cases/{case_id}/documents/generated/{document_id}` | GET | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `hooks/legal/useDocumentGeneration.ts:32` |
| `cases/{case_id}/documents/{document_id}/versions` | GET | `/legal/cases/[id]/documents` | CONSUMIDO_REAL | `hooks/legal/useDocumentVersions.ts:37` |
| `cases/{case_id}/documents/{document_id}/versions` | POST | `/legal/cases/[id]/documents` | CONSUMIDO_PARCIAL | `hooks/legal/useDocumentVersions.ts:44` (hook; UI limitada) |
| `cases/{case_id}/documents/{document_id}/versions/{version_id}` | GET | — | HUÉRFANO | Sin fetch en `legal-cases-api.ts` |

### Snapshots / auditoría de cadena

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `cases/{case_id}/snapshots` | GET | `/legal/cases/[id]/snapshots` | CONSUMIDO_REAL | `hooks/legal/useCaseSnapshots.ts:13` |
| `cases/{case_id}/snapshots` | POST | `/legal/cases/[id]/snapshots` | CONSUMIDO_REAL | `hooks/legal/useCaseSnapshots.ts` (postSnapshot) |
| `cases/{case_id}/snapshots/{snapshot_id}` | GET | `/legal/cases/[id]/snapshots` | CONSUMIDO_PARCIAL | `fetchSnapshotDetail` `legal-cases-api.ts:280` sin uso en UI |
| `cases/{case_id}/snapshots/diff` | GET | — | HUÉRFANO | Link “view_diff” `CaseSnapshotsList.tsx:47` sin fetch |
| `cases/{case_id}/snapshots/verify` | GET | `/legal/cases/[id]/snapshots` | CONSUMIDO_PARCIAL | `CaseSnapshotsList.tsx:17-23` verifica hashes **client-side**, no API |

> **Nota spec:** `audit_chain_verification` del task packet corresponde a `GET cases/{case_id}/snapshots/verify` en OpenAPI (`verify_snapshot_chain`). No hay ruta con ese nombre literal.

### Audiencias

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `hearings` | GET | `/legal/audiencias` | CONSUMIDO_REAL | `lib/legal/hearings/hearings-api.ts` listHearings |
| `hearings` | POST | `/legal/audiencias` | CONSUMIDO_REAL | `hearings-api.ts` createHearing |
| `hearings/{hearing_id}` | GET | `/legal/audiencias` | CONSUMIDO_PARCIAL | API existe; detalle inline en dashboard |
| `hearings/{hearing_id}/status` | PATCH | `/legal/audiencias` | CONSUMIDO_REAL | `HearingStatusControl.tsx` |
| `hearings/config` | GET | `/legal/audiencias` | CONSUMIDO_REAL | `hooks/legal/useHearings.ts` |
| `hearings/kpis` | GET | `/legal/audiencias` | CONSUMIDO_REAL | `hooks/legal/useHearings.ts` |

### Abogados (attorneys)

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `attorneys` | GET | — | HUÉRFANO | Sin consumidor |
| `attorneys` | POST | — | HUÉRFANO | Sin consumidor |
| `attorneys/{attorney_id}` | GET | — | HUÉRFANO | Sin consumidor |
| `attorneys/{attorney_id}` | PATCH | — | HUÉRFANO | Sin consumidor |

### Cola de validación

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `validation-queue` | GET | — | HUÉRFANO | Sin consumidor |
| `validation-queue/stats` | GET | — | HUÉRFANO | Sin consumidor |
| `validation-queue/{item_id}` | GET | — | HUÉRFANO | Sin consumidor |
| `validation-queue/{item_id}/approve` | POST | — | HUÉRFANO | Sin consumidor |
| `validation-queue/{item_id}/assign` | PATCH | — | HUÉRFANO | Sin consumidor |
| `validation-queue/{item_id}/claim` | PATCH | — | HUÉRFANO | Sin consumidor |
| `validation-queue/{item_id}/reject` | POST | — | HUÉRFANO | Sin consumidor |

### Flujos procesales (`flujos/*`)

| ENDPOINT | MÉTODO | PANTALLA CONSUMIDORA | ESTADO | EVIDENCIA |
|----------|--------|----------------------|--------|-----------|
| `flujos/health` | GET | — | HUÉRFANO | Sin consumidor |
| `flujos/iniciar` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/iniciar-con-expediente` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/estado` | GET | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/avanzar` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/cancelar` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/compuerta` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/confirmar-etapa` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/dato` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/documento` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/evento-plazo` | POST | — | HUÉRFANO | Sin consumidor |
| `flujos/{instancia_flujo_id}/acciones-recomendadas` | POST | — | HUÉRFANO | Sin consumidor |

---

## Backlog Fase 1 (derivado de matriz)

| PR | Scope | Endpoints / gaps |
|----|-------|------------------|
| **PR-1** | Research | Badges MOCK/DRAFT; rechazo strict-mode; GR-14 en research layout |
| **PR-2** | Expedientes | Fix actions paths; snapshots diff/verify real; actors error honesto; related link/detect; strategies/generate; archive path |
| **PR-3** | Auditoría | `/legal/audit` + `snapshots/verify` integridad cadena visual |
| **PR-4** | Library + Config | `knowledge-pack/jurisdictions`, library search si existe; config badges draft/verified |
| **PR-5** | Banners | S3 warning documents; disaster mode wiring; GR-14 no-dismiss |

### HUÉRFANOS con justificación pendiente (requiere decisión César)

Bloques sin UI planificada en spec v1.0 — documentar en PR si se posponen:

- `flujos/*` (12 endpoints) — motor de flujos no expuesto en Forge Legal UI
- `validation-queue/*` (7) — cola de validación abogado
- `attorneys/*` (4) — gestión de abogados tenant
- `notifications/preferences` (2)
- `export/pdf` — export opinión legal global
- `meta/disaster-mode/actions|force|health-check` — ops admin
- `cases/search`, `cases/{id}/state`, `cases/{id}/classification`, `cases/{id}/chains/{trigger}`
- Duplicados lock acquire/release

---

## Comandos de verificación reproducibles

```bash
# Contar endpoints legales en OpenAPI vivo
curl -s https://nadakki-ai-suite.onrender.com/openapi.json | node -e "
const o=JSON.parse(require('fs').readFileSync(0,'utf8'));
let n=0; for(const p of Object.keys(o.paths)) if(p.includes('/legal/')) for(const m of Object.keys(o.paths[p])) if(['get','post','put','patch','delete'].includes(m)) n++; console.log(n);
"

# Rutas legales en repo
find app/\(forge\)/legal -name 'page.tsx' | wc -l

# Phantom FE paths (no en OpenAPI)
rg 'available_actions|verify_extracted_data|/archive' lib/legal/cases/legal-cases-api.ts

# Tenants hardcodeados en JSX legal (debe ser 0 UUIDs prohibidos)
rg '0a91ee98|550e8400' app/\(forge\)/legal components/legal hooks/legal
```

---

*Generado en Fase 0 — actualizado PR-2/3/4/5 (2026-07-19).*

**Veredicto builder:** `LEGAL_UI_FULL_COVERAGE_READY_FOR_FOUNDER_QA` — pending Founder QA per `GUIA_DE_PRUEBA_MANUAL.md`.

### PR-3 probes (2026-07-19)

| Endpoint | Status | Clasificación |
|----------|--------|---------------|
| `GET .../audit_chain_verification` | 404 | BACKEND_DEFECT BD-006 |
| `GET .../snapshots` | 200 (array) | FRONTEND_FIXABLE — normalizar array en fetchSnapshots |
| `GET .../snapshots/{id}` | 200 | CONSUMIDO_REAL PR-3 |
| `GET .../snapshots/verify` | 500 | BACKEND_DEFECT BD-003 |
| `GET .../snapshots/diff` | 500 | BACKEND_DEFECT BD-004 |
| `GET /library/*` | 404 | HUÉRFANO_BACKEND_NO_MONTADO BD-007 |
| `GET /meta/disaster-mode` | 200 NORMAL | CONSUMIDO_REAL (PR-5 verificado) |
