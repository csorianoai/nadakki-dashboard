# GUÍA DE PRUEBA MANUAL — Legal Core UI (Founder QA)

**Duración estimada:** 45–60 minutos  
**URL base:** https://dashboard.nadakki.com (o localhost con proxy a backend Render)  
**Tenant:** Nadakki Demo `d3b00111-0000-0000-0000-000000d3b001`  
**Modo:** ventana **incógnito** (sin sessionStorage de disclaimers previos)

---

## Preparación

1. Abrir ventana incógnito.
2. Iniciar sesión en el dashboard Forge.
3. Seleccionar tenant **Nadakki Demo** en el selector global (no Credicefi `0a91ee98-…` ni Banco Piloto `550e8400-…`).
4. Verificar banner **GR-14** visible en `/legal` y `/legal/research`.
5. Tener a mano esta guía y la tabla de registro al final.

---

## ERRORES CONOCIDOS — NO REPORTAR COMO NUEVOS

Estos síntomas están documentados en `BACKEND_DEFECTS_LEDGER.md`. Si los ve, marque “Esperado (BD-xxx)” en la tabla final.

| ID | Pantalla / paso | Síntoma exacto en UI |
|----|-----------------|----------------------|
| **BD-001** | Archivar expediente | Al confirmar archivar: panel rojo HTTP **404** “Not Found”, referencia BD-001 |
| **BD-002** | Documentos → verificar datos extraídos | Panel “Verificación de datos extraídos no disponible”, HTTP **404**, BD-002 |
| **BD-003** | Snapshots → “Verificar cadena” o Auditoría → snapshots/verify | Panel error HTTP **500**, mensaje UUID inválido `'verify'`, BD-003 |
| **BD-004** | Snapshots → “Diff vs anterior” | Panel error HTTP **500**, UUID inválido `'diff'`, BD-004 |
| **BD-005** | Crear expediente (wizard) | Warning: actores no persistidos; GET actores vacío tras crear |
| **BD-006** | Auditoría → audit_chain_verification | Panel HTTP **404** Not Found, BD-006 |
| **BD-007** | Biblioteca `/legal/library` | Badge **DEMO** + panel 404 library no montada, BD-007 |

---

## Recorrido E2E

### 1. Quick-check contratos (~5 min)

| | |
|---|---|
| **URL** | `/legal/contracts` |
| **Acción** | Pegar texto de contrato corto → “Analizar contrato” |
| **Esperado** | Resultado con decisión, citas o códigos; badge MOCK/DRAFT si aplica |
| **Anotar si difiere** | HTTP error, tenant missing, sin disclaimer |

### 2. Home + tasks (~5 min)

| | |
|---|---|
| **URL** | `/legal` |
| **Acción** | Revisar strip de estado; lanzar un task legal si lista carga |
| **Esperado** | Health OK; tasks desde API o fallback documentado |
| **Anotar** | |

### 3. Crear expediente (~8 min)

| | |
|---|---|
| **URL** | `/legal/cases/new` |
| **Acción** | Completar wizard con al menos un actor |
| **Esperado** | 201 + redirect; **puede** aparecer warning BD-005 si actores vacíos |
| **Anotar** | Copiar `case_id` creado |

### 4. Documentos (~7 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/documents` |
| **Acción** | Ver banner S3; intentar subir PDF de prueba; abrir revisión datos extraídos si hay doc con OCR |
| **Esperado** | Banner amarillo S3; upload puede fallar por storage; verify → BD-002 si endpoint ausente |
| **Anotar** | |

### 5. Acciones dinámicas (~5 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}` |
| **Acción** | Menú acciones: `generate_strategies`; probar transición de estado |
| **Esperado** | Acciones desde GET case; POST /actions 200 o error honesto 409 |
| **Anotar** | |

### 6. Estrategias, plazos, issues (~8 min)

| Rutas | `/legal/cases/{id}/strategy`, `/deadlines`, `/issues` |
| **Acción** | Listar; override plazo (reason + legal_basis); crear issue |
| **Esperado** | Datos reales o errores HTTP visibles |
| **Anotar** | |

### 7. Snapshots (~5 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/snapshots` |
| **Acción** | Crear manual; ver detalle; verificar cadena; diff |
| **Esperado** | Lista carga (array API); verify/diff → BD-003/004 |
| **Anotar** | |

### 8. Auditoría (~5 min)

| | |
|---|---|
| **URL** | `/legal/audit?case_id={id}` |
| **Acción** | audit_chain_verification + snapshots/verify fallback |
| **Esperado** | Trail list; BD-006 y/o BD-003 en paneles |
| **Anotar** | |

### 9. Archivar (~3 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/archive` |
| **Acción** | Confirmar archivar |
| **Esperado** | BD-001 (404) — no éxito simulado |
| **Anotar** | |

### 10. Research (~5 min)

| | |
|---|---|
| **URL** | `/legal/research` |
| **Acción** | Pregunta legal concreta con jurisdicción DO |
| **Esperado** | Dictamen, citas, badges MOCK/DRAFT; rechazo strict-mode si aplica |
| **Anotar** | |

### 11. Biblioteca + config (~5 min)

| | |
|---|---|
| **URLs** | `/legal/library`, `/legal/config` |
| **Acción** | Library: confirmar DEMO + BD-007; Config: packs DO verified, CO skeleton |
| **Esperado** | Badges VERIFIED vs DRAFT — NO CERTIFICADO |
| **Anotar** | |

### 12. Audiencias + comparador (~3 min)

| | |
|---|---|
| **URLs** | `/legal/audiencias`, `/legal/strategies/historical` |
| **Acción** | Smoke: listados cargan |
| **Esperado** | 200 API |
| **Anotar** | |

---

## Tabla de registro (completar en QA)

| PANTALLA | PASO | ESPERADO | REAL | SEVERIDAD |
|----------|------|----------|------|-----------|
| | | | | |
| | | | | |
| | | | | |

**Severidad:** `blocker` \| `major` \| `minor` \| `expected-bd` (si coincide con tabla conocida)

---

## Gate verificado por builder

```bash
# Tenants prohibidos en JSX legal
rg "0a91ee98|550e8400" app/(forge)/legal components/legal hooks/legal lib/legal

npm run build
```

**Veredicto objetivo:** `LEGAL_UI_FULL_COVERAGE_READY_FOR_FOUNDER_QA` (no `PRODUCTION_READY`).

---

## Huérfanos deferred (justificación escrita)

| Bloque | Razón |
|--------|--------|
| `flujos/*` (12) | Motor de flujos procesales — fuera scope vitrina MVP; requiere UX dedicada post-M1 |
| `validation-queue/*` (7) | Cola abogado — sin pantalla hasta workflow de certificación |
| `attorneys/*` (4) | Gestión perfiles abogado — admin futuro |
| `notifications/preferences` (2) | Preferencias — sin UI de notificaciones legal |
| `export/pdf` (global) | PDF per-documento consumido; export opinión global pendiente producto |
| `cases/search` | Búsqueda nominal/cédula — UI usa list filters |
| `meta/disaster-mode/actions\|force` | Ops admin — no portal usuario |

Matriz autoritativa: `LEGAL_UI_COVERAGE_MATRIX.md`
