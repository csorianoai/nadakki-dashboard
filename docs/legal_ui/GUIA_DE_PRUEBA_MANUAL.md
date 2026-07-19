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

### Defectos BD-001…007 — **CERRADOS** (ai-suite PR #624, verificado 2026-07-19)

Ya **no** deben aparecer paneles `BD-xxx` en UI. Si reaparecen, es regresión — reportar como **nuevo**.

| ID | Estado post-#624 | Comportamiento esperado ahora |
|----|------------------|-------------------------------|
| BD-001 | Cerrado | `POST /archive` responde (409 si transición no permitida, no 404 fantasma) |
| BD-002 | Cerrado | Endpoint existe; 404 solo si documento no encontrado |
| BD-003 | Cerrado | `GET .../snapshots/verify` → 200 |
| BD-004 | Cerrado | `GET .../snapshots/diff?from_id=&to_id=` → 200 o error de negocio honesto |
| BD-005 | Cerrado | `POST .../actors` → 201 |
| BD-006 | Cerrado | `GET .../audit_chain_verification` → 200 `chain_integrity: VALID` |
| BD-007 | Cerrado | `GET /library/status` y `/library/search` → 200 |

### Deuda backend / datos — sigue vigente (no es BD-xxx)

| Síntoma | Pantalla | Notas |
|---------|----------|-------|
| Upload documento HTTP **500** | `/legal/cases/{id}/documents` | Deuda S3/storage backend — UI debe mostrar error visible (no silencioso) |
| Pack DO = **DRAFT — NO CERTIFICADO** | `/legal/config` | **Estado correcto** hasta certificación de Ramón — no esperar VERIFIED |
| Jurisdicción **CO comparte hash con DO** | `/legal/config` | Anomalía de datos backend pendiente — no es bug de UI |
| Timeout sesión / expulsión a login | Deep-links `/legal/*` | HN-01 — loop backend/BFF aparte |

### Rutas eliminadas (hardening HN-02)

| Ruta | Esperado |
|------|----------|
| `/legal/guide` | **404** — ruta eliminada (dashboard mock retirado) |

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
| **Esperado** | 201 + redirect; actores persistidos (BD-005 cerrado) |
| **Anotar** | Copiar `case_id` creado |

### 4. Documentos (~7 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/documents` |
| **Acción** | Ver banner S3 amarillo **sticky**; subir PDF de prueba |
| **Esperado** | Banner visible antes de cargar expediente; upload 500 → panel error con detalle colapsable (deuda S3) |
| **Anotar** | |

### 5. Acciones dinámicas (~5 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}` |
| **Acción** | Menú acciones; transición de estado |
| **Esperado** | Etiquetas en español (ej. “Agregar parte”, “→ Cerrado”); POST /actions 200 o error honesto 409 |
| **Anotar** | |

### 6. Estrategias, plazos, issues (~8 min)

| Rutas | `/legal/cases/{id}/strategy`, `/deadlines`, `/issues` |
| **Acción** | Listar; override plazo; crear issue |
| **Esperado** | Datos reales o errores HTTP visibles |
| **Anotar** | |

### 7. Snapshots (~5 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/snapshots` |
| **Acción** | Verificar cadena; diff entre versiones |
| **Esperado** | verify → 200 cadena íntegra; diff con `from_id`/`to_id` |
| **Anotar** | |

### 8. Auditoría (~5 min)

| | |
|---|---|
| **URL** | `/legal/audit?case_id={id}` |
| **Acción** | Verificar cadena del expediente |
| **Esperado** | Título “Trazabilidad de auditoría”; cadena VALID (sin panel BD-006) |
| **Anotar** | |

### 9. Archivar (~3 min)

| | |
|---|---|
| **URL** | `/legal/cases/{id}/archive` |
| **Acción** | Confirmar archivar |
| **Esperado** | Error HTTP honesto si transición no permitida (409) — sin panel BD-001 |
| **Anotar** | |

### 10. Research (~5 min)

| | |
|---|---|
| **URL** | `/legal/research` |
| **Acción** | Pregunta legal concreta con jurisdicción DO |
| **Esperado** | Dictamen, citas, badges MOCK/DRAFT |
| **Anotar** | |

### 11. Biblioteca + config (~5 min)

| | |
|---|---|
| **URLs** | `/legal/library`, `/legal/config` |
| **Acción** | Library: status + búsqueda real; Config: packs y jurisdicciones |
| **Esperado** | Library carga (sin DEMO/BD-007); pack DO = **DRAFT — NO CERTIFICADO**; CO puede compartir hash DO (anomalía conocida) |
| **Anotar** | |

### 12. Audiencias + comparador (~3 min)

| | |
|---|---|
| **URLs** | `/legal/audiencias`, `/legal/strategies/historical` |
| **Acción** | Smoke: listados cargan |
| **Esperado** | 200 API |
| **Anotar** | |

### 13. Onboarding (~2 min)

| | |
|---|---|
| **URL** | `/legal/onboarding` |
| **Esperado** | Formulario funcional — **conservado** |
| **Anotar** | |

---

## Tabla de registro (completar en QA)

| PANTALLA | PASO | ESPERADO | REAL | SEVERIDAD |
|----------|------|----------|------|-----------|
| | | | | |

**Severidad:** `blocker` | `major` | `minor` | `expected-known` (deuda S3, CO=hash, HN-01)

---

## Gate verificado por builder

```bash
rg "0a91ee98|550e8400" app/(forge)/legal components/legal hooks/legal lib/legal
rg "/legal/guide" components/legal app/(forge)/legal lib/legal
npm run build
```

**Veredicto objetivo:** `LEGAL_UI_HARDENED_FRONT_CLOSED`

---

## Huérfanos deferred (justificación escrita)

| Bloque | Razón |
|--------|--------|
| `flujos/*` (12) | Motor de flujos procesales — fuera scope vitrina MVP |
| `validation-queue/*` (7) | Cola abogado — sin pantalla hasta certificación |
| `attorneys/*` (4) | Gestión perfiles abogado — admin futuro |
| `notifications/preferences` (2) | Preferencias — sin UI legal |
| `export/pdf` (global) | Export opinión global pendiente producto |
| `cases/search` | Búsqueda nominal — UI usa list filters |
| `meta/disaster-mode/actions\|force` | Ops admin |

Matriz autoritativa: `LEGAL_UI_COVERAGE_MATRIX.md`
