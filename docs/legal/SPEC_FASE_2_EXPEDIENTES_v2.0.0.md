# NADAKKI LEGAL CORE — FASE 2: CAPA DE EXPEDIENTES

**Versión:** v2.0.0 (zero technical debt)
**Fecha:** 2026-05-06
**Estado:** Spec arquitectónico aprobado — todos los huecos cerrados
**Cambios desde v1.0.0:** integración de 8 huecos críticos + 7 huecos importantes + 10 huecos de auditabilidad/resiliencia. Total: 25 mejoras estructurales.

**Pre-requisitos cumplidos:**
- ✅ Fase 1 (Task Launcher) mergeado en `nadakki-dashboard` commit `ea50147`
- ✅ Backend v2.2 con 28 agentes funcionales en `nadakki-ai-suite` commit `6994ec7e`
- ✅ Base de datos de plazos legales `data/legal/legal_deadlines_db.json` (54 deadlines validados)
- ✅ RAG con 39 documentos / 9,821 chunks en Supabase
- ✅ Mapping de 14 tareas v1.0.0 (`config/legal/legal_tasks_v1.0.0.yaml`)

---

## TABLA DE CONTENIDOS

1. [Resumen ejecutivo y cambios v2.0.0](#1-resumen)
2. [Posicionamiento del producto](#2-posicionamiento)
3. [Arquitectura de alto nivel actualizada](#3-arquitectura)
4. [Modelo de dominio: Expediente extendido](#4-modelo-dominio)
5. [Schema de base de datos completo (8 tablas)](#5-schema-db)
6. [Máquina de estados con sub-estados](#6-state-machine)
7. [Schemas Pydantic v2 actualizados](#7-schemas-pydantic)
8. [Estructura de archivos](#8-archivos)
9. [Los YAMLs de tipos de caso (3 + 2 sub-tipos penales)](#9-yamls)
10. [Sistema de acciones por estado (menú dinámico)](#10-acciones)
11. [Endpoints API extendidos](#11-endpoints)
12. [Frontend `/legal/cases`](#12-frontend)
13. [Sistema de auditabilidad profunda](#13-auditabilidad)
14. [Sistema de override de plazos legales](#14-overrides)
15. [Sistema de issues y error detection](#15-issues)
16. [Risk engine y confidence layer](#16-risk-engine)
17. [Concurrencia: locking de expedientes](#17-locking)
18. [Disaster mode y resiliencia](#18-disaster-mode)
19. [Notificaciones automáticas](#19-notificaciones)
20. [Plan de implementación — 5 sub-fases](#20-plan)
21. [Asignación de workers](#21-workers)
22. [Acceptance criteria (gate Go/No-Go)](#22-acceptance)
23. [Riesgos y mitigación](#23-riesgos)

---

## 1. RESUMEN EJECUTIVO Y CAMBIOS v2.0.0

### Qué resuelve la Fase 2

Una **capa de orquestación de expedientes legales** sobre la capa de tareas individuales. Modela el trabajo real de un despacho jurídico: expedientes vivos con documentos, plazos, eventos, estrategias múltiples, snapshots auditables, y resiliencia operativa.

### Cambios v1.0.0 → v2.0.0

**Nuevas tablas (3 adicionales, total 8):**
- `legal_case_snapshots` — versiones inmutables del expediente en momentos clave
- `legal_case_issues` — sistema de detección y reporte de errores
- `legal_case_locks` — locking optimista para edición concurrente

**Nuevos servicios (4 adicionales, total 11):**
- `decision_trace.py` — explicabilidad de cada decisión de agente
- `deadline_override.py` — overrides legales humanos sobre plazos automáticos
- `risk_engine.py` — perfil de riesgo del expediente
- `confidence_aggregator.py` — score de confianza agregado
- `case_lock_manager.py` — concurrencia
- `disaster_mode.py` — degradación elegante cuando LLM/RAG/DB fallan

**Nuevos conceptos en el modelo:**
- Estrategias múltiples ejecutables en paralelo (no solo una)
- Estados de documentos (`draft → reviewed → finalized → submitted → received`)
- Sub-tipos de caso penal (`imputado`, `victima_querellante`, `evaluacion_general`)
- Verificación humana de datos extraídos antes de cálculo de plazos
- Casos relacionados (cross-case linking)
- Acciones administrativas (anotaciones, prioridad, reasignación)
- Eventos programados (audiencias futuras)
- Iteración sobre estrategias y documentos (no one-shot)
- Manejo de plazos vencidos al ingresar
- Catálogo parametrizado de motivos de apelación

### Cobertura del primer release

**3 tipos de caso canónicos + 2 sub-tipos penales = 5 archivos YAML:**

| Tipo | YAML | Aplicación |
|---|---|---|
| `defensa_civil_cobro_pesos` | `defensa_civil_cobro_pesos.yaml` | Defensa cuando cliente recibe demanda |
| `recurso_apelacion_civil` | `recurso_apelacion_civil.yaml` | Cliente trae sentencia y quiere recurrir |
| `caso_penal_imputado` | `caso_penal_imputado.yaml` | Cliente es imputado o detenido |
| `caso_penal_victima_querellante` | `caso_penal_victima_querellante.yaml` | Cliente quiere accionar |
| `caso_penal_evaluacion_general` | `caso_penal_evaluacion_general.yaml` | Consulta penal antes de definir rol |

### Tiempo total estimado

**21 días corridos** (3 semanas calendario) divididos en 5 sub-fases. Cero deuda técnica al cierre.

---

## 2. POSICIONAMIENTO DEL PRODUCTO

### Modo dual confirmado

| Modo | Tenant ejemplo | Pantalla principal | Uso típico |
|---|---|---|---|
| **Institutional Legal Mode** | Credicefi (banco) | `/legal` task launcher (Fase 1) | Análisis ad-hoc de contratos, AML/KYC |
| **Law Firm Case Mode** | Despacho jurídico privado | `/legal/cases` expedientes (Fase 2) | Gestión de expedientes de clientes externos |

Un tenant puede usar ambos modos simultáneamente. La diferenciación es por propósito de uso, no por arquitectura.

### Disclaimer Ley 91 RD aplica en ambos modos

Cada output, cada documento generado, cada análisis lleva `requiere_revision_abogado: true`. El sistema es asistencia legal automatizada, no asesoría legal.

---

## 3. ARQUITECTURA DE ALTO NIVEL ACTUALIZADA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN (FRONTEND)                      │
│                                                                           │
│  /legal (Fase 1)              /legal/cases (Fase 2 — NUEVO)             │
│  └─ Task Launcher              ├─ /legal/cases (lista + filtros)         │
│                                ├─ /legal/cases/new (wizard 3 pasos)      │
│                                ├─ /legal/cases/[id] (detalle)            │
│                                ├─ /legal/cases/[id]/timeline             │
│                                ├─ /legal/cases/[id]/documents            │
│                                ├─ /legal/cases/[id]/strategy             │
│                                ├─ /legal/cases/[id]/deadlines            │
│                                ├─ /legal/cases/[id]/issues               │
│                                ├─ /legal/cases/[id]/risk                 │
│                                ├─ /legal/cases/[id]/snapshots            │
│                                └─ /legal/cases/[id]/archive              │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼ HTTPS
┌─────────────────────────────────────────────────────────────────────────┐
│                     CAPA DE ORQUESTACIÓN (NUEVO EN F2)                   │
│                                                                           │
│  api/legal/expedientes/                                                  │
│  ├─ create_case.py                                                       │
│  ├─ ingest_document.py                                                   │
│  ├─ list_cases.py                                                        │
│  ├─ get_case.py                                                          │
│  ├─ case_actions.py        (menú dinámico de acciones por estado)        │
│  ├─ case_timeline.py                                                     │
│  ├─ case_deadlines.py                                                    │
│  ├─ case_deadline_override.py  (NUEVO - overrides humanos)               │
│  ├─ case_strategies.py     (NUEVO - múltiples estrategias)               │
│  ├─ case_documents_lifecycle.py (NUEVO - estados de docs)                │
│  ├─ case_issues.py         (NUEVO - reporte de errores)                  │
│  ├─ case_snapshots.py      (NUEVO - snapshots inmutables)                │
│  ├─ case_risk.py           (NUEVO - risk profile)                        │
│  ├─ case_locks.py          (NUEVO - concurrencia)                        │
│  ├─ case_relations.py      (NUEVO - related cases)                       │
│  ├─ case_notifications.py  (NUEVO - alertas)                             │
│  └─ archive_case.py                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  CAPA DE SERVICIOS (NUEVO EN F2)                         │
│                                                                           │
│  services/legal/expedientes/                                             │
│  ├─ schemas_expedientes.py                                               │
│  ├─ persistencia_expedientes.py                                          │
│  ├─ case_loader.py                                                       │
│  ├─ case_state_machine.py                                                │
│  ├─ case_orchestrator.py                                                 │
│  ├─ deadline_engine.py                                                   │
│  ├─ deadline_override.py        (NUEVO)                                  │
│  ├─ document_intake.py                                                   │
│  ├─ document_lifecycle.py       (NUEVO)                                  │
│  ├─ document_association.py     (NUEVO - matching doc↔expediente)       │
│  ├─ data_extraction_review.py   (NUEVO - verificación humana OCR)        │
│  ├─ strategy_engine.py          (NUEVO - múltiples estrategias)          │
│  ├─ decision_trace.py           (NUEVO - explicabilidad)                 │
│  ├─ risk_engine.py              (NUEVO)                                  │
│  ├─ confidence_aggregator.py    (NUEVO)                                  │
│  ├─ case_snapshots.py           (NUEVO - inmutables)                     │
│  ├─ case_issues_service.py      (NUEVO)                                  │
│  ├─ case_lock_manager.py        (NUEVO - concurrencia)                   │
│  ├─ case_relations_service.py   (NUEVO)                                  │
│  ├─ case_archive.py                                                      │
│  ├─ event_emitter.py                                                     │
│  ├─ notification_engine.py      (NUEVO)                                  │
│  └─ disaster_mode.py            (NUEVO - resiliencia)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              CAPA DE AGENTES EXISTENTES (NO SE TOCA)                     │
│  agents/legal/  (28 agentes funcionales)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CAPA DE PERSISTENCIA                                │
│                                                                           │
│  Supabase PostgreSQL (8 tablas nuevas):                                  │
│  ├─ legal_cases                                                          │
│  ├─ legal_case_documents                                                 │
│  ├─ legal_case_events                                                    │
│  ├─ legal_case_deadlines                                                 │
│  ├─ legal_case_actors                                                    │
│  ├─ legal_case_snapshots         (NUEVO)                                 │
│  ├─ legal_case_issues            (NUEVO)                                 │
│  └─ legal_case_locks             (NUEVO)                                 │
│                                                                           │
│  Existente (no se toca):                                                 │
│  ├─ legal_library_documents (RAG capa 2)                                 │
│  ├─ legal_library_chunks                                                 │
│  └─ legal_executions                                                     │
│                                                                           │
│  Filesystem encrypted Fernet:                                            │
│  └─ data/legal/case_documents/{tenant_id}/{case_id}/                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. MODELO DE DOMINIO: EXPEDIENTE EXTENDIDO

### Concepto central

Un **Expediente** es una unidad viva de trabajo legal con:

- **Identidad** (case_id UUID + número interno)
- **Tipo** (mapea a YAML)
- **Estado actual** + **sub-estados** (especialmente en penal)
- **Documentos** (cronológicos, con ciclo de vida propio)
- **Eventos** (audit trail inmutable)
- **Plazos activos** (con countdown + posibilidad de override humano)
- **Estrategias** (múltiples seleccionables en paralelo)
- **Actores** (cliente, abogado, contraparte, tribunal)
- **Snapshots** (versiones inmutables en momentos clave)
- **Issues** (errores detectados o reportados)
- **Risk profile** (probabilidad de pérdida, exposición financiera)
- **Confidence score** (cuán confiable es la información del expediente)
- **Lock state** (quién está editando ahora)
- **Casos relacionados** (mismo cliente, mismo conflicto)
- **Notificaciones programadas**

### Conceptos clave nuevos

**(a) Estrategias múltiples paralelas:**
Un caso puede ejecutar simultáneamente:
- Defensa principal (en tribunal)
- Negociación extrajudicial
- Excepción procesal
Cada una tiene su propio set de documentos y seguimiento.

**(b) Estados del documento:**
```
draft → reviewed_by_agent → reviewed_by_attorney → finalized → submitted_to_court → received_by_court → resolved
```
Documentos generados por sistema empiezan en `draft`. El abogado los mueve adelante.

**(c) Snapshots inmutables:**
Cada vez que ocurre una decisión crítica (estrategia escogida, estado cambiado, documento finalizado), el sistema crea un snapshot inmutable del expediente en ese momento. Esto permite reconstruir "qué sabía el abogado cuando decidió X".

**(d) Decision trace:**
Cada output de agente registra inputs, reglas aplicadas, confidence, alternativas consideradas. Auditoría profunda.

**(e) Verificación humana de datos extraídos:**
Cuando OCR extrae datos críticos (fecha de notificación, monto, partes), el sistema NO calcula plazos automáticamente. Pide confirmación humana primero. Si el abogado confirma, se calcula. Si corrige, se usa el corregido.

---

## 5. SCHEMA DE BASE DE DATOS COMPLETO (8 TABLAS)

### 5.1 Tabla `legal_cases` (extendida)

```sql
CREATE TABLE legal_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number_internal VARCHAR(64) NOT NULL UNIQUE,
    case_number_external VARCHAR(128),
    tenant_id UUID NOT NULL,

    case_type VARCHAR(64) NOT NULL,
    case_type_version VARCHAR(16) NOT NULL DEFAULT '1.0.0',

    legal_jurisdiction VARCHAR(8) NOT NULL DEFAULT 'do',
    territorial_jurisdiction VARCHAR(16),
    competent_tribunal VARCHAR(255),

    state VARCHAR(32) NOT NULL DEFAULT 'INGESTION',
    sub_state VARCHAR(64),                       -- NUEVO: ej "AUDIENCIA_MEDIDA_COERCION"
    state_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    practice_area_tags TEXT[] NOT NULL DEFAULT '{}',
    monto_demandado DECIMAL(15,2),
    moneda VARCHAR(8) DEFAULT 'DOP',

    -- NUEVO: roles múltiples del cliente (relevante en penal)
    client_roles TEXT[] NOT NULL DEFAULT '{}',   -- ej: ["victima", "querellante"]

    -- NUEVO: priorización
    priority VARCHAR(16) NOT NULL DEFAULT 'normal',  -- 'low', 'normal', 'high', 'critical'

    -- NUEVO: confidence agregado del expediente (0.0-1.0)
    confidence_score DECIMAL(3,2),
    confidence_factors JSONB,                    -- por qué ese score

    -- NUEVO: anotaciones privadas del abogado
    private_notes TEXT,

    -- NUEVO: casos relacionados
    related_case_ids UUID[] DEFAULT '{}',

    -- NUEVO: si el caso tiene plazo crítico vencido al ingresar
    has_expired_critical_deadline_at_ingestion BOOLEAN DEFAULT FALSE,
    expired_deadline_recovery_strategy VARCHAR(64),  -- 'casacion_per_saltum', 'revision_error', etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    archived_by UUID,

    retention_years INT NOT NULL DEFAULT 10,
    purge_eligible_at TIMESTAMPTZ,

    knowledge_pack_hash_at_creation VARCHAR(128) NOT NULL,
    case_type_yaml_hash VARCHAR(128) NOT NULL,

    CONSTRAINT chk_state CHECK (state IN (
        'EVALUACION_INICIAL', 'INGESTION', 'TRIAGE', 'STRATEGY', 'ACTIVE',
        'HEARING', 'JUDGMENT', 'APPEAL', 'EXECUTION', 'CLOSED', 'ARCHIVED'
    )),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    CONSTRAINT chk_jurisdiction CHECK (legal_jurisdiction IN ('do', 'co', 'mx'))
);

CREATE INDEX idx_cases_tenant ON legal_cases(tenant_id);
CREATE INDEX idx_cases_state ON legal_cases(tenant_id, state);
CREATE INDEX idx_cases_priority ON legal_cases(tenant_id, priority, state);
CREATE INDEX idx_cases_type ON legal_cases(tenant_id, case_type);

ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_cases
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.2 Tabla `legal_case_documents` (extendida con lifecycle)

```sql
CREATE TABLE legal_case_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    document_type VARCHAR(64) NOT NULL,
    document_subtype VARCHAR(64),
    direction VARCHAR(16) NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    storage_path TEXT NOT NULL,
    storage_size_bytes BIGINT NOT NULL,
    storage_mime_type VARCHAR(64),
    storage_hash_sha256 VARCHAR(128) NOT NULL,
    encryption_key_ref VARCHAR(64) NOT NULL,

    ocr_completed BOOLEAN NOT NULL DEFAULT FALSE,
    extracted_text_chunks INT,

    -- NUEVO: datos extraídos por OCR pendientes de verificación humana
    extracted_data JSONB,                        -- {fecha_notificacion, monto, partes, etc.}
    extracted_data_human_verified BOOLEAN NOT NULL DEFAULT FALSE,
    extracted_data_verified_at TIMESTAMPTZ,
    extracted_data_verified_by UUID,
    extracted_data_corrections JSONB,            -- correcciones del abogado

    document_date DATE,
    notification_date DATE,
    issuing_party VARCHAR(255),

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL,

    classification_agent VARCHAR(64),
    classification_confidence DECIMAL(3,2),
    auto_analyzed BOOLEAN NOT NULL DEFAULT FALSE,
    auto_analysis_at TIMESTAMPTZ,

    -- NUEVO: ciclo de vida del documento
    lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'draft',
    lifecycle_history JSONB DEFAULT '[]',        -- transiciones registradas
    submitted_to_court_at TIMESTAMPTZ,
    submitted_to_court_acuse_recibo TEXT,
    received_by_court_at TIMESTAMPTZ,

    -- NUEVO: si documento es generado, link a estrategia que lo originó
    generated_from_strategy_id UUID,

    -- NUEVO: para asociación automática doc ↔ expediente
    auto_associated BOOLEAN DEFAULT FALSE,
    association_confidence DECIMAL(3,2),
    association_reviewed_by UUID,

    CONSTRAINT chk_direction CHECK (direction IN ('incoming', 'outgoing', 'internal')),
    CONSTRAINT chk_lifecycle CHECK (lifecycle_status IN (
        'draft', 'reviewed_by_agent', 'reviewed_by_attorney',
        'finalized', 'submitted_to_court', 'received_by_court', 'resolved', 'rejected'
    ))
);

CREATE INDEX idx_case_docs_case ON legal_case_documents(case_id, uploaded_at DESC);
CREATE INDEX idx_case_docs_lifecycle ON legal_case_documents(case_id, lifecycle_status);

ALTER TABLE legal_case_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_documents
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.3 Tabla `legal_case_events` (extendida con decision trace)

```sql
CREATE TABLE legal_case_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    event_type VARCHAR(64) NOT NULL,
    event_category VARCHAR(32) NOT NULL,

    actor_type VARCHAR(16) NOT NULL,
    actor_id VARCHAR(64),

    payload JSONB NOT NULL,

    -- NUEVO: decision trace para explicabilidad
    decision_trace JSONB,                        -- {inputs, rules_applied, confidence, alternatives}

    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sealed_hash VARCHAR(128),
    previous_event_id UUID,

    agent_chain TEXT[],
    knowledge_pack_hash VARCHAR(128),

    CONSTRAINT chk_actor_type CHECK (actor_type IN ('human', 'agent', 'system')),
    CONSTRAINT chk_event_category CHECK (event_category IN (
        'lifecycle', 'document', 'analysis', 'deadline',
        'human_action', 'notification', 'archive',
        'strategy', 'issue', 'snapshot', 'lock', 'risk'
    ))
);

CREATE INDEX idx_case_events_case ON legal_case_events(case_id, occurred_at DESC);
CREATE INDEX idx_case_events_decision_trace ON legal_case_events USING GIN (decision_trace)
    WHERE decision_trace IS NOT NULL;

ALTER TABLE legal_case_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_events
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.4 Tabla `legal_case_deadlines` (extendida con override layer)

```sql
CREATE TABLE legal_case_deadlines (
    deadline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    deadline_db_id VARCHAR(64) NOT NULL,
    deadline_category VARCHAR(32) NOT NULL,
    deadline_sub_category VARCHAR(64) NOT NULL,

    trigger_event TEXT NOT NULL,
    trigger_date DATE NOT NULL,
    trigger_document_id UUID REFERENCES legal_case_documents(document_id),

    deadline_value INT NOT NULL,
    deadline_unit VARCHAR(16) NOT NULL,
    computation_rule VARCHAR(32) NOT NULL,

    -- Cálculo automático original
    auto_calculated_deadline_date DATE NOT NULL,

    -- NUEVO: override humano (si existe, este reemplaza al automático)
    has_human_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_deadline_date DATE,
    override_reason TEXT,
    override_legal_basis TEXT,                   -- "Suspensión por feriado decretado"
    override_by UUID,
    override_at TIMESTAMPTZ,

    -- Fecha efectiva (override si existe, sino auto)
    effective_deadline_date DATE GENERATED ALWAYS AS (
        COALESCE(override_deadline_date, auto_calculated_deadline_date)
    ) STORED,

    deadline_alert_dates DATE[] NOT NULL DEFAULT '{}',

    status VARCHAR(16) NOT NULL DEFAULT 'active',
    completed_at TIMESTAMPTZ,
    completed_by_action_id UUID,
    extended_to_date DATE,
    extension_reason TEXT,

    legal_basis VARCHAR(255) NOT NULL,
    is_peremptory BOOLEAN NOT NULL DEFAULT TRUE,
    is_extendable BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,

    -- NUEVO: cadena de overrides (preserva historial)
    override_history JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_deadline_status CHECK (status IN (
        'active', 'completed', 'expired', 'cancelled', 'extended', 'overridden'
    ))
);

CREATE INDEX idx_deadlines_case ON legal_case_deadlines(case_id, effective_deadline_date);
CREATE INDEX idx_deadlines_active ON legal_case_deadlines(tenant_id, effective_deadline_date)
    WHERE status = 'active';

ALTER TABLE legal_case_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_deadlines
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.5 Tabla `legal_case_actors` (extendida)

```sql
CREATE TABLE legal_case_actors (
    actor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    role VARCHAR(32) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    actor_kind VARCHAR(16) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    identification_type VARCHAR(16),
    identification_number VARCHAR(64),

    email VARCHAR(255),
    phone VARCHAR(64),
    address TEXT,

    -- NUEVO: notificación al cliente
    notification_preferences JSONB DEFAULT '{}',

    -- NUEVO: detección de conflicto de interés
    conflict_check_done BOOLEAN NOT NULL DEFAULT FALSE,
    conflict_check_at TIMESTAMPTZ,
    conflict_detected BOOLEAN DEFAULT FALSE,
    conflict_details TEXT,

    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_actor_role CHECK (role IN (
        'cliente', 'abogado_titular', 'abogado_asistente',
        'contraparte', 'abogado_contraparte', 'tribunal',
        'alguacil', 'testigo', 'perito', 'ministerio_publico',
        'juez', 'fiscal', 'querellante', 'imputado', 'otro'
    )),
    CONSTRAINT chk_actor_kind CHECK (actor_kind IN (
        'persona_fisica', 'persona_juridica', 'institucion'
    ))
);

CREATE INDEX idx_actors_case ON legal_case_actors(case_id);
CREATE INDEX idx_actors_role ON legal_case_actors(case_id, role);
CREATE INDEX idx_actors_conflict ON legal_case_actors(tenant_id, identification_number)
    WHERE identification_number IS NOT NULL;

ALTER TABLE legal_case_actors ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_actors
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.6 Tabla `legal_case_snapshots` (NUEVA)

Snapshots inmutables del expediente en momentos críticos para auditabilidad profunda.

```sql
CREATE TABLE legal_case_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Trigger del snapshot
    snapshot_reason VARCHAR(64) NOT NULL,        -- 'state_changed', 'strategy_selected',
                                                 -- 'document_finalized', 'manual', etc.
    state_at_snapshot VARCHAR(32) NOT NULL,
    sub_state_at_snapshot VARCHAR(64),

    -- Snapshot completo del expediente (JSONB para portabilidad)
    case_data JSONB NOT NULL,                    -- snapshot del legal_cases row
    documents_summary JSONB NOT NULL,            -- IDs + hashes + lifecycle status
    deadlines_snapshot JSONB NOT NULL,           -- todos los plazos en ese momento
    selected_strategies JSONB,                   -- estrategias activas en ese momento
    actors_snapshot JSONB NOT NULL,              -- actores en ese momento

    -- Confidence en el momento del snapshot
    confidence_score_at_snapshot DECIMAL(3,2),
    risk_profile_at_snapshot JSONB,

    -- Hashes para inmutabilidad
    snapshot_hash_sha256 VARCHAR(128) NOT NULL,
    previous_snapshot_id UUID REFERENCES legal_case_snapshots(snapshot_id),
    chained_hash VARCHAR(128) NOT NULL,           -- previous_hash + current_hash

    -- Trazabilidad
    knowledge_pack_hash VARCHAR(128) NOT NULL,
    case_type_yaml_hash VARCHAR(128) NOT NULL,

    triggered_by_event_id UUID REFERENCES legal_case_events(event_id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,

    CONSTRAINT chk_snapshot_reason CHECK (snapshot_reason IN (
        'state_changed', 'strategy_selected', 'document_finalized',
        'document_submitted', 'manual', 'pre_archive', 'post_judgment',
        'deadline_override', 'critical_decision'
    ))
);

CREATE INDEX idx_snapshots_case ON legal_case_snapshots(case_id, created_at DESC);
CREATE INDEX idx_snapshots_reason ON legal_case_snapshots(case_id, snapshot_reason);

ALTER TABLE legal_case_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_snapshots
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.7 Tabla `legal_case_issues` (NUEVA)

Sistema de detección y reporte de errores legales.

```sql
CREATE TABLE legal_case_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    -- Tipo de issue
    issue_type VARCHAR(64) NOT NULL,
    issue_category VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'medium',

    -- Detalles
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Origen
    detected_by VARCHAR(16) NOT NULL,            -- 'agent', 'attorney', 'system', 'client'
    detected_by_id VARCHAR(64),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Referencia al objeto problemático
    related_object_type VARCHAR(32),             -- 'deadline', 'document', 'strategy', 'agent_output'
    related_object_id UUID,

    -- Resolución
    status VARCHAR(16) NOT NULL DEFAULT 'open',
    assigned_to UUID,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,

    -- Aprendizaje (para mejora del sistema)
    contributes_to_training BOOLEAN NOT NULL DEFAULT TRUE,
    training_label VARCHAR(64),

    CONSTRAINT chk_issue_type CHECK (issue_type IN (
        'wrong_deadline', 'wrong_strategy', 'bad_document_generation',
        'wrong_classification', 'missing_data', 'jurisprudence_outdated',
        'agent_failure', 'data_extraction_error', 'state_machine_violation',
        'conflict_of_interest', 'compliance_breach', 'other'
    )),
    CONSTRAINT chk_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT chk_status CHECK (status IN ('open', 'investigating', 'resolved', 'wont_fix', 'duplicate'))
);

CREATE INDEX idx_issues_case ON legal_case_issues(case_id);
CREATE INDEX idx_issues_open ON legal_case_issues(tenant_id, status, severity)
    WHERE status = 'open';

ALTER TABLE legal_case_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_issues
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.8 Tabla `legal_case_locks` (NUEVA)

Concurrencia optimista para edición multiusuario.

```sql
CREATE TABLE legal_case_locks (
    lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES legal_cases(case_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,

    locked_by UUID NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lock_expires_at TIMESTAMPTZ NOT NULL,         -- típicamente +5min, refrescable

    lock_reason VARCHAR(64) NOT NULL,             -- 'editing_strategy', 'reviewing_documents', etc.
    lock_scope VARCHAR(32) NOT NULL DEFAULT 'soft',  -- 'soft' (warning) | 'hard' (blocks)

    released_at TIMESTAMPTZ,
    released_by UUID,
    release_reason VARCHAR(64),

    CONSTRAINT chk_lock_scope CHECK (lock_scope IN ('soft', 'hard'))
);

CREATE UNIQUE INDEX idx_active_lock_per_case ON legal_case_locks(case_id)
    WHERE released_at IS NULL;
CREATE INDEX idx_locks_user ON legal_case_locks(locked_by, released_at);

ALTER TABLE legal_case_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON legal_case_locks
    USING (tenant_id::text = current_setting('app.current_tenant', true));
```

### 5.9 Migrations

```
db/migrations/legal_phase2/
├── 001_create_legal_cases.sql
├── 002_create_legal_case_documents.sql
├── 003_create_legal_case_events.sql
├── 004_create_legal_case_deadlines.sql
├── 005_create_legal_case_actors.sql
├── 006_create_legal_case_snapshots.sql           (NUEVO)
├── 007_create_legal_case_issues.sql              (NUEVO)
├── 008_create_legal_case_locks.sql               (NUEVO)
├── 009_grant_rls_policies.sql
└── 010_create_helper_functions.sql               (cómputo de plazos, etc.)
```

Para SQLite local: adapter `_apply_schema_patches()` con `_ensure_column()` mapeando UUID→TEXT, JSONB→TEXT JSON, ARRAY→TEXT JSON, TIMESTAMPTZ→TEXT ISO8601.

---

## 6. MÁQUINA DE ESTADOS CON SUB-ESTADOS

### Estados principales (11 estados, +2 desde v1.0.0)

| Estado | Significado | Trigger entrada |
|---|---|---|
| `EVALUACION_INICIAL` | Análisis pre-compromiso del abogado | `create_evaluation()` (NUEVO) |
| `INGESTION` | Caso creado, esperando documentos | Decisión de tomar el caso |
| `TRIAGE` | Análisis automático en curso | Primer documento clasificado |
| `STRATEGY` | Esperando elección humana de estrategia | Triage completo |
| `ACTIVE` | Estrategia(s) escogida(s), trabajando | Selección de estrategia |
| `HEARING` | Audiencia agendada o en curso | `hearing.scheduled` |
| `JUDGMENT` | Sentencia recibida | Documento `sentencia` cargado |
| `APPEAL` | Recurso interpuesto | `interponer_apelacion` |
| `EXECUTION` | Post-sentencia firme, ejecución (NUEVO) | Sentencia firme + acción de ejecutar |
| `CLOSED` | Caso cerrado, no archivado | `cerrar_caso` |
| `ARCHIVED` | Cumplió retención | Cron post-retention |

### Sub-estados (especialmente relevantes en penal)

```
Para caso_penal_imputado:
  HEARING.AUDIENCIA_MEDIDA_COERCION
  HEARING.AUDIENCIA_PRELIMINAR
  HEARING.JUICIO_ORAL
  HEARING.LECTURA_SENTENCIA

Para recurso_apelacion_civil:
  HEARING.AUDIENCIA_INFORMATIVA_CORTE
  HEARING.CONCLUSIONES
  
Para defensa_civil_cobro_pesos:
  HEARING.AUDIENCIA_CIVIL
```

### Transiciones permitidas (matriz completa)

```
EVALUACION_INICIAL → INGESTION                  [humano: "tomar el caso"]
EVALUACION_INICIAL → CLOSED                     [humano: "no tomar"]

INGESTION → TRIAGE                              [auto, primer doc clasificable]
INGESTION → CLOSED                              [humano, abandono temprano]

TRIAGE → STRATEGY                               [auto, análisis completo]
TRIAGE → INGESTION                              [humano, faltan docs]

STRATEGY → ACTIVE                               [humano, escoge ≥1 estrategia]
STRATEGY → CLOSED                               [humano, decline_to_proceed]

ACTIVE → ACTIVE                                 [self-loop: nuevas estrategias, docs adicionales]
ACTIVE → HEARING                                [auto/humano: citación a audiencia]
ACTIVE → JUDGMENT                               [auto: doc sentencia cargado]
ACTIVE → CLOSED                                 [humano: transacción extrajudicial]

HEARING → HEARING                               [self-loop: cambio de sub-estado]
HEARING → JUDGMENT                              [auto: sentencia recibida]
HEARING → ACTIVE                                [humano: aplazamiento]

JUDGMENT → APPEAL                               [humano: decide apelar]
JUDGMENT → EXECUTION                            [humano: ejecutar sentencia favorable]
JUDGMENT → CLOSED                               [auto: vence apelación + sin ejecución]

APPEAL → JUDGMENT                               [auto: sentencia de Corte]
APPEAL → ACTIVE                                 [auto: recurso admitido]
APPEAL → CLOSED                                 [humano: desistimiento]

EXECUTION → EXECUTION                           [self-loop: actos de ejecución]
EXECUTION → CLOSED                              [auto/humano: ejecución completada]

CLOSED → ARCHIVED                               [auto cron post-retention]
CLOSED → ACTIVE                                 [humano: reapertura justificada]
```

### Permisos por rol

| Rol | EVALUACION | INGESTION | TRIAGE | STRATEGY | ACTIVE | HEARING | JUDGMENT | APPEAL | EXECUTION | CLOSED | ARCHIVED |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `abogado_titular` | RW | RW | RW | RW | RW | RW | RW | RW | RW | RW | R |
| `abogado_asistente` | RW | RW | RW | R+suggest | RW | R | R | R | RW | R | R |
| `compliance_officer` | R | R | R | R | R | R | R | R | R | R | R+archive |
| `cliente` | — | R(filtered) | R(filtered) | R(filtered) | R(filtered) | R(filtered) | R(filtered) | R(filtered) | R(filtered) | R(filtered) | — |

---

## 7. SCHEMAS PYDANTIC v2 ACTUALIZADOS

### `services/legal/expedientes/schemas_expedientes.py`

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

# ============================================================================
# TIPOS LITERAL
# ============================================================================

CaseState = Literal[
    'EVALUACION_INICIAL', 'INGESTION', 'TRIAGE', 'STRATEGY', 'ACTIVE',
    'HEARING', 'JUDGMENT', 'APPEAL', 'EXECUTION', 'CLOSED', 'ARCHIVED'
]

CaseType = Literal[
    'defensa_civil_cobro_pesos',
    'recurso_apelacion_civil',
    'caso_penal_imputado',
    'caso_penal_victima_querellante',
    'caso_penal_evaluacion_general',
]

ActorRole = Literal[
    'cliente', 'abogado_titular', 'abogado_asistente',
    'contraparte', 'abogado_contraparte', 'tribunal',
    'alguacil', 'testigo', 'perito', 'ministerio_publico',
    'juez', 'fiscal', 'querellante', 'imputado', 'otro'
]

DocumentDirection = Literal['incoming', 'outgoing', 'internal']

DocumentLifecycleStatus = Literal[
    'draft', 'reviewed_by_agent', 'reviewed_by_attorney',
    'finalized', 'submitted_to_court', 'received_by_court',
    'resolved', 'rejected'
]

CasePriority = Literal['low', 'normal', 'high', 'critical']

IssueType = Literal[
    'wrong_deadline', 'wrong_strategy', 'bad_document_generation',
    'wrong_classification', 'missing_data', 'jurisprudence_outdated',
    'agent_failure', 'data_extraction_error', 'state_machine_violation',
    'conflict_of_interest', 'compliance_breach', 'other'
]

IssueSeverity = Literal['low', 'medium', 'high', 'critical']

LockScope = Literal['soft', 'hard']

# ============================================================================
# MODELOS
# ============================================================================

class CaseActor(BaseModel):
    model_config = ConfigDict(extra='forbid')

    actor_id: Optional[UUID] = None
    role: ActorRole
    is_primary: bool = False
    actor_kind: Literal['persona_fisica', 'persona_juridica', 'institucion']
    full_name: str = Field(min_length=2, max_length=255)
    identification_type: Optional[Literal['cedula', 'rnc', 'pasaporte', 'tribunal_id']] = None
    identification_number: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notification_preferences: Dict[str, Any] = Field(default_factory=dict)
    conflict_check_done: bool = False
    conflict_detected: bool = False
    conflict_details: Optional[str] = None

class ExtractedData(BaseModel):
    """Datos extraídos por OCR pendientes/verificados."""
    model_config = ConfigDict(extra='forbid')

    fecha_notificacion: Optional[date] = None
    fecha_documento: Optional[date] = None
    monto: Optional[Decimal] = None
    partes_detectadas: List[str] = Field(default_factory=list)
    tribunal_emisor: Optional[str] = None
    confidence_per_field: Dict[str, float] = Field(default_factory=dict)

class CaseDocument(BaseModel):
    model_config = ConfigDict(extra='forbid')

    document_id: Optional[UUID] = None
    document_type: str
    document_subtype: Optional[str] = None
    direction: DocumentDirection
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    document_date: Optional[date] = None
    notification_date: Optional[date] = None
    issuing_party: Optional[str] = None
    storage_size_bytes: int
    storage_mime_type: Optional[str] = None

    # NUEVO: lifecycle
    lifecycle_status: DocumentLifecycleStatus = 'draft'
    submitted_to_court_at: Optional[datetime] = None
    received_by_court_at: Optional[datetime] = None

    # NUEVO: extracción y verificación
    extracted_data: Optional[ExtractedData] = None
    extracted_data_human_verified: bool = False
    extracted_data_corrections: Optional[Dict[str, Any]] = None

    # NUEVO: si fue generado, link a estrategia
    generated_from_strategy_id: Optional[UUID] = None

class DeadlineOverride(BaseModel):
    """Override humano de un plazo automático."""
    model_config = ConfigDict(extra='forbid')

    override_deadline_date: date
    override_reason: str = Field(min_length=10, max_length=500)
    override_legal_basis: str = Field(min_length=5, max_length=255)
    override_by: UUID
    override_at: datetime

class CaseDeadline(BaseModel):
    model_config = ConfigDict(extra='forbid')

    deadline_id: Optional[UUID] = None
    deadline_db_id: str
    deadline_category: str
    deadline_sub_category: str
    trigger_event: str
    trigger_date: date
    deadline_value: int
    deadline_unit: str
    computation_rule: str
    auto_calculated_deadline_date: date

    # NUEVO: override layer
    has_human_override: bool = False
    override: Optional[DeadlineOverride] = None
    effective_deadline_date: date  # auto si no override, override si existe
    override_history: List[Dict[str, Any]] = Field(default_factory=list)

    deadline_alert_dates: List[date] = Field(default_factory=list)
    status: Literal['active', 'completed', 'expired', 'cancelled', 'extended', 'overridden'] = 'active'
    legal_basis: str
    is_peremptory: bool = True
    is_extendable: bool = False
    notes: Optional[str] = None

class DecisionTrace(BaseModel):
    """Trace completo de una decisión de agente para auditabilidad."""
    model_config = ConfigDict(extra='forbid')

    inputs: List[Dict[str, Any]]
    rules_applied: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
    alternative_options: List[Dict[str, Any]] = Field(default_factory=list)
    knowledge_pack_chunks_used: List[str] = Field(default_factory=list)
    rag_citations: List[Dict[str, Any]] = Field(default_factory=list)

class CaseEvent(BaseModel):
    model_config = ConfigDict(extra='forbid')

    event_id: Optional[UUID] = None
    event_type: str
    event_category: Literal[
        'lifecycle', 'document', 'analysis', 'deadline',
        'human_action', 'notification', 'archive',
        'strategy', 'issue', 'snapshot', 'lock', 'risk'
    ]
    actor_type: Literal['human', 'agent', 'system']
    actor_id: Optional[str] = None
    payload: Dict[str, Any]
    decision_trace: Optional[DecisionTrace] = None  # NUEVO
    occurred_at: datetime
    agent_chain: List[str] = Field(default_factory=list)

class CaseStrategy(BaseModel):
    """Una estrategia legal del expediente."""
    model_config = ConfigDict(extra='forbid')

    strategy_id: UUID
    name: str
    description: str
    legal_basis: str
    rationale: str
    expected_strength: float = Field(ge=0.0, le=1.0)
    risks: List[str]
    jurisprudence_citations: List[str] = Field(default_factory=list)
    documents_to_generate: List[str]

    # NUEVO: estrategias paralelas
    selected: bool = False
    selected_at: Optional[datetime] = None
    selected_by: Optional[UUID] = None
    can_run_parallel_with: List[UUID] = Field(default_factory=list)

    status: Literal['proposed', 'selected', 'executing', 'completed', 'abandoned'] = 'proposed'

class RiskProfile(BaseModel):
    """Perfil de riesgo del expediente."""
    model_config = ConfigDict(extra='forbid')

    probability_of_loss: float = Field(ge=0.0, le=1.0)
    financial_exposure: Optional[Decimal] = None
    legal_complexity: Literal['low', 'medium', 'high', 'critical']
    timeline_risk: Literal['low', 'medium', 'high', 'critical']
    overall_risk_score: float = Field(ge=0.0, le=1.0)
    factors: List[Dict[str, Any]] = Field(default_factory=list)
    last_calculated_at: datetime

class CaseSnapshot(BaseModel):
    """Snapshot inmutable del expediente."""
    model_config = ConfigDict(extra='forbid')

    snapshot_id: UUID
    snapshot_reason: Literal[
        'state_changed', 'strategy_selected', 'document_finalized',
        'document_submitted', 'manual', 'pre_archive', 'post_judgment',
        'deadline_override', 'critical_decision'
    ]
    state_at_snapshot: CaseState
    case_data: Dict[str, Any]
    documents_summary: List[Dict[str, Any]]
    deadlines_snapshot: List[Dict[str, Any]]
    selected_strategies: List[Dict[str, Any]]
    actors_snapshot: List[Dict[str, Any]]
    confidence_score_at_snapshot: float
    risk_profile_at_snapshot: Optional[Dict[str, Any]] = None
    snapshot_hash_sha256: str
    chained_hash: str
    knowledge_pack_hash: str
    created_at: datetime
    created_by: UUID

class CaseIssue(BaseModel):
    """Issue/error reportado en el expediente."""
    model_config = ConfigDict(extra='forbid')

    issue_id: Optional[UUID] = None
    issue_type: IssueType
    issue_category: Literal['data', 'legal', 'process', 'compliance']
    severity: IssueSeverity
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10)
    detected_by: Literal['agent', 'attorney', 'system', 'client']
    detected_by_id: Optional[str] = None
    related_object_type: Optional[str] = None
    related_object_id: Optional[UUID] = None
    status: Literal['open', 'investigating', 'resolved', 'wont_fix', 'duplicate'] = 'open'
    resolution_notes: Optional[str] = None

class CaseLock(BaseModel):
    """Lock activo del expediente."""
    model_config = ConfigDict(extra='forbid')

    lock_id: UUID
    locked_by: UUID
    locked_at: datetime
    lock_expires_at: datetime
    lock_reason: str
    lock_scope: LockScope = 'soft'

class CaseConfidence(BaseModel):
    """Score agregado de confianza del expediente."""
    model_config = ConfigDict(extra='forbid')

    overall_score: float = Field(ge=0.0, le=1.0)
    factors: Dict[str, float] = Field(default_factory=dict)
    # ej: {"documents_complete": 0.6, "deadlines_verified": 1.0, "strategy_strength": 0.8}
    last_calculated_at: datetime

class LegalCase(BaseModel):
    """Modelo completo de un Expediente."""
    model_config = ConfigDict(extra='forbid')

    case_id: Optional[UUID] = None
    case_number_internal: str
    case_number_external: Optional[str] = None
    tenant_id: UUID
    case_type: CaseType
    case_type_version: str = '1.0.0'
    legal_jurisdiction: str = 'do'
    territorial_jurisdiction: Optional[str] = None
    competent_tribunal: Optional[str] = None

    state: CaseState = 'EVALUACION_INICIAL'
    sub_state: Optional[str] = None
    state_changed_at: Optional[datetime] = None

    title: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    practice_area_tags: List[str] = Field(default_factory=list)
    monto_demandado: Optional[Decimal] = None
    moneda: str = 'DOP'

    client_roles: List[str] = Field(default_factory=list)  # NUEVO
    priority: CasePriority = 'normal'  # NUEVO
    private_notes: Optional[str] = None  # NUEVO
    related_case_ids: List[UUID] = Field(default_factory=list)  # NUEVO

    has_expired_critical_deadline_at_ingestion: bool = False  # NUEVO
    expired_deadline_recovery_strategy: Optional[str] = None  # NUEVO

    actors: List[CaseActor] = Field(default_factory=list)
    documents: List[CaseDocument] = Field(default_factory=list)
    deadlines: List[CaseDeadline] = Field(default_factory=list)
    strategies: List[CaseStrategy] = Field(default_factory=list)  # NUEVO

    confidence: Optional[CaseConfidence] = None  # NUEVO
    risk_profile: Optional[RiskProfile] = None  # NUEVO
    active_lock: Optional[CaseLock] = None  # NUEVO
    open_issues_count: int = 0  # NUEVO

    retention_years: int = 10
    knowledge_pack_hash_at_creation: Optional[str] = None
    case_type_yaml_hash: Optional[str] = None

# ============================================================================
# REQUEST/RESPONSE
# ============================================================================

class CreateCaseRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    case_type: CaseType
    title: str
    description: Optional[str] = None
    territorial_jurisdiction: Optional[str] = None
    monto_demandado: Optional[Decimal] = None
    practice_area_tags: List[str] = Field(default_factory=list)
    client_roles: List[str] = Field(default_factory=list)
    priority: CasePriority = 'normal'
    initial_state: Literal['EVALUACION_INICIAL', 'INGESTION'] = 'INGESTION'
    initial_actors: List[CaseActor] = Field(min_length=1)
    related_case_ids: List[UUID] = Field(default_factory=list)

class CreateCaseResponse(BaseModel):
    case_id: UUID
    case_number_internal: str
    state: CaseState
    next_steps: List[str]
    available_actions: List[str]  # NUEVO: menú de acciones por estado
    conflict_check_required: bool  # NUEVO
    created_at: datetime

class CaseActionRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    action_name: str
    payload: Dict[str, Any]
    create_snapshot_after: bool = True  # NUEVO

class DeadlineOverrideRequest(BaseModel):
    """Solicitud de override de plazo."""
    model_config = ConfigDict(extra='forbid')

    new_deadline_date: date
    reason: str = Field(min_length=10, max_length=500)
    legal_basis: str = Field(min_length=5, max_length=255)

class DocumentLifecycleTransitionRequest(BaseModel):
    """Transición de estado de un documento."""
    model_config = ConfigDict(extra='forbid')

    new_status: DocumentLifecycleStatus
    notes: Optional[str] = None
    submitted_to_court_acuse: Optional[str] = None  # si aplica

class IssueReportRequest(BaseModel):
    """Reporte de issue desde frontend."""
    model_config = ConfigDict(extra='forbid')

    issue_type: IssueType
    severity: IssueSeverity
    title: str
    description: str
    related_object_type: Optional[str] = None
    related_object_id: Optional[UUID] = None

class StrategySelectionRequest(BaseModel):
    """Selección de estrategias (puede ser múltiple)."""
    model_config = ConfigDict(extra='forbid')

    strategy_ids: List[UUID] = Field(min_length=1)
    rationale: Optional[str] = None
    generate_documents_immediately: bool = True

class CaseLockRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    lock_reason: str
    lock_scope: LockScope = 'soft'
    duration_minutes: int = Field(default=5, ge=1, le=60)
```

---

## 8. ESTRUCTURA DE ARCHIVOS

### Backend (`nadakki-ai-suite`)

```
config/legal/case_types/                              # NUEVO
├── _schema.yaml
├── defensa_civil_cobro_pesos.yaml
├── recurso_apelacion_civil.yaml
├── caso_penal_imputado.yaml                          # NUEVO sub-tipo
├── caso_penal_victima_querellante.yaml               # NUEVO sub-tipo
└── caso_penal_evaluacion_general.yaml                # NUEVO sub-tipo

config/legal/                                          
├── legal_tasks_v1.0.0.yaml (existente)
├── legal_deadlines_db.json (existente)
├── motivos_apelacion_civil_rd.yaml                   # NUEVO catálogo parametrizado
└── recovery_strategies_for_expired_deadlines.yaml    # NUEVO

services/legal/expedientes/                           # NUEVO
├── __init__.py
├── schemas_expedientes.py
├── persistencia_expedientes.py
├── case_loader.py
├── case_state_machine.py
├── case_orchestrator.py
├── deadline_engine.py
├── deadline_override.py                              # NUEVO
├── document_intake.py
├── document_lifecycle.py                             # NUEVO
├── document_association.py                           # NUEVO
├── data_extraction_review.py                         # NUEVO
├── strategy_engine.py                                # NUEVO
├── decision_trace.py                                 # NUEVO
├── risk_engine.py                                    # NUEVO
├── confidence_aggregator.py                          # NUEVO
├── case_snapshots.py                                 # NUEVO
├── case_issues_service.py                            # NUEVO
├── case_lock_manager.py                              # NUEVO
├── case_relations_service.py                         # NUEVO
├── case_archive.py
├── event_emitter.py
├── notification_engine.py                            # NUEVO
└── disaster_mode.py                                  # NUEVO

api/legal/expedientes/                                # NUEVO
├── __init__.py
├── create_case.py
├── list_cases.py
├── get_case.py
├── ingest_document.py
├── case_actions.py
├── case_timeline.py
├── case_deadlines.py
├── case_deadline_override.py                         # NUEVO
├── case_strategies.py                                # NUEVO
├── case_documents_lifecycle.py                       # NUEVO
├── case_issues.py                                    # NUEVO
├── case_snapshots.py                                 # NUEVO
├── case_risk.py                                      # NUEVO
├── case_locks.py                                     # NUEVO
├── case_relations.py                                 # NUEVO
├── case_notifications.py                             # NUEVO
└── archive_case.py

db/migrations/legal_phase2/                           # NUEVO
├── 001_create_legal_cases.sql
├── 002_create_legal_case_documents.sql
├── 003_create_legal_case_events.sql
├── 004_create_legal_case_deadlines.sql
├── 005_create_legal_case_actors.sql
├── 006_create_legal_case_snapshots.sql               # NUEVO
├── 007_create_legal_case_issues.sql                  # NUEVO
├── 008_create_legal_case_locks.sql                   # NUEVO
├── 009_grant_rls_policies.sql
└── 010_create_helper_functions.sql

tests/legal/expedientes/                              # NUEVO
├── __init__.py
├── conftest.py
├── test_case_creation.py
├── test_case_state_machine.py
├── test_deadline_engine.py
├── test_deadline_override.py                         # NUEVO
├── test_document_intake.py
├── test_document_lifecycle.py                        # NUEVO
├── test_document_association.py                      # NUEVO
├── test_data_extraction_review.py                    # NUEVO
├── test_strategy_engine_multi.py                     # NUEVO
├── test_decision_trace.py                            # NUEVO
├── test_risk_engine.py                               # NUEVO
├── test_confidence_aggregator.py                     # NUEVO
├── test_case_snapshots.py                            # NUEVO
├── test_case_issues.py                               # NUEVO
├── test_case_locks.py                                # NUEVO
├── test_case_relations.py                            # NUEVO
├── test_disaster_mode.py                             # NUEVO
├── test_notifications.py                             # NUEVO
├── test_cross_tenant_cases.py                        # CRÍTICO bloqueante
├── test_archive_retention.py
└── integration/
    ├── test_flow_cobro_pesos_e2e.py
    ├── test_flow_apelacion_civil_e2e.py
    ├── test_flow_penal_imputado_e2e.py
    ├── test_flow_penal_querellante_e2e.py
    ├── test_flow_penal_evaluacion_e2e.py
    ├── test_multi_strategy_parallel.py               # NUEVO
    ├── test_deadline_override_full_flow.py           # NUEVO
    └── test_disaster_mode_failover.py                # NUEVO

scripts/legal/expedientes/                            # NUEVO
├── seed_test_cases.py
├── recalculate_deadlines.py
├── archive_eligible_cases.py
├── notify_upcoming_deadlines.py                      # NUEVO cron
├── snapshot_critical_state_changes.py                # NUEVO
└── detect_potential_conflicts_of_interest.py         # NUEVO
```

### Frontend (`nadakki-dashboard`)

```
app/(forge)/legal/cases/                              # NUEVO
├── page.tsx
├── new/page.tsx
└── [id]/
    ├── page.tsx                                      # detalle (overview)
    ├── timeline/page.tsx
    ├── documents/page.tsx
    ├── strategy/page.tsx
    ├── deadlines/page.tsx
    ├── issues/page.tsx                               # NUEVO
    ├── risk/page.tsx                                 # NUEVO
    ├── snapshots/page.tsx                            # NUEVO
    └── archive/page.tsx

components/legal/cases/                               # NUEVO
├── CaseList.tsx
├── CaseCard.tsx
├── CaseDetailHeader.tsx
├── CaseStateIndicator.tsx
├── CaseSubStateIndicator.tsx                         # NUEVO
├── CasePriorityBadge.tsx                             # NUEVO
├── CaseConfidenceMeter.tsx                           # NUEVO
├── CaseRiskBadge.tsx                                 # NUEVO
├── CaseLockBanner.tsx                                # NUEVO
├── CaseTimeline.tsx
├── CaseDocumentsList.tsx
├── CaseDocumentUploader.tsx
├── CaseDocumentLifecycleSelector.tsx                 # NUEVO
├── CaseDocumentExtractedDataReview.tsx               # NUEVO
├── CaseDeadlinesPanel.tsx
├── CaseDeadlineOverrideModal.tsx                     # NUEVO
├── CaseActorsPanel.tsx
├── CaseActionsMenu.tsx                               # ACTUALIZADO con menú dinámico
├── CaseStrategySelector.tsx
├── CaseStrategyCard.tsx                              # NUEVO
├── CaseStrategyMultiSelect.tsx                       # NUEVO
├── CaseIssuesPanel.tsx                               # NUEVO
├── CaseIssueReportModal.tsx                          # NUEVO
├── CaseSnapshotsList.tsx                             # NUEVO
├── CaseRelatedCasesPanel.tsx                         # NUEVO
├── CaseDecisionTraceViewer.tsx                       # NUEVO (debug/audit)
├── CaseDisasterModeBanner.tsx                        # NUEVO
├── CaseCreateWizard.tsx
├── CaseCreateWizardEvaluacionMode.tsx                # NUEVO modo eval
├── CaseTypeSelector.tsx
└── CaseConflictCheckBanner.tsx                       # NUEVO

hooks/legal/                                          # NUEVO
├── useLegalCases.ts
├── useLegalCase.ts
├── useCaseActions.ts
├── useCaseTimeline.ts
├── useCaseDeadlines.ts
├── useCaseStrategies.ts                              # NUEVO
├── useCaseDocuments.ts
├── useCaseDocumentLifecycle.ts                       # NUEVO
├── useCaseIssues.ts                                  # NUEVO
├── useCaseSnapshots.ts                               # NUEVO
├── useCaseRisk.ts                                    # NUEVO
├── useCaseLock.ts                                    # NUEVO
├── useCaseRelated.ts                                 # NUEVO
└── useDisasterMode.ts                                # NUEVO

lib/legal/cases/                                      # NUEVO
├── case-types.ts
├── case-state-machine-client.ts
├── deadline-formatter.ts
├── strategy-helpers.ts                               # NUEVO
├── confidence-helpers.ts                             # NUEVO
└── lifecycle-helpers.ts                              # NUEVO

__tests__/legal/cases/                                # NUEVO
├── CaseList.test.tsx
├── CaseTimeline.test.tsx
├── CaseDeadlinesPanel.test.tsx
├── CaseDeadlineOverrideModal.test.tsx                # NUEVO
├── CaseStrategyMultiSelect.test.tsx                  # NUEVO
├── CaseDocumentExtractedDataReview.test.tsx          # NUEVO
├── CaseIssuesPanel.test.tsx                          # NUEVO
├── CaseSnapshotsList.test.tsx                        # NUEVO
├── CaseConfidenceMeter.test.tsx                      # NUEVO
├── CaseLockBanner.test.tsx                           # NUEVO
├── CaseDisasterModeBanner.test.tsx                   # NUEVO
├── CaseCreateWizard.test.tsx
└── useLegalCases.test.tsx

messages/es/                                          # MODIFICAR
└── legal-cases.json                                  # NUEVO i18n
```

---

## 9. LOS YAMLs DE TIPOS DE CASO (3 + 2 SUB-TIPOS PENALES)

Por brevedad muestro los 3 principales actualizados con todas las nuevas estructuras. Los 2 sub-tipos penales adicionales siguen el mismo patrón.

### `config/legal/case_types/defensa_civil_cobro_pesos.yaml`

```yaml
case_type_id: defensa_civil_cobro_pesos
version: '1.0.0'

display:
  display_name_es: "Defensa civil — cobro de pesos"
  description_es: "Defensa de cliente que recibió demanda en cobro de pesos"
  icon_hint: "scale-balance"
  practice_area_tags_default: ["civil", "comercial", "bancario"]

applicability:
  jurisdictions: ["do"]
  legal_branches: ["civil", "comercial"]
  case_severity: "medium"

# Plazos relevantes (referencias a legal_deadlines_db.json)
relevant_deadlines:
  - deadline_db_id: CIVIL-PRESCRIPCION-002
    rationale: "Verificar prescripción contractual 2 años"
    auto_check: true
    blocking_if_expired: false
    recovery_strategy_if_expired: ninguna
  - deadline_db_id: CIVIL-APELACION-001
    rationale: "Plazo apelación 1 mes desde notificación"
    auto_check: false
    blocking_if_expired: true
    recovery_strategy_if_expired: revision_por_error_o_casacion_extraordinaria
  - deadline_db_id: CIVIL-APELACION-002
    rationale: "Plazo reducido sentencia defecto 15 días"
    auto_check: false
  - deadline_db_id: CIVIL-CASACION-001
    rationale: "Plazo casación post-Corte"
    auto_check: false

# Estados completos con permisos y acciones
states:
  - state: EVALUACION_INICIAL
    description: "Análisis pre-compromiso del abogado"
    next_states_allowed: [INGESTION, CLOSED]
    permits_documents: true
    permits_agent_chains:
      - clasificador_documentos
      - calculador_plazos_procesales
    output_required:
      - viabilidad_caso
      - plazos_criticos_si_aplica
      - estimacion_complejidad
    requires_human_decision: true
    available_actions:
      - tomar_caso_y_proceder_a_ingestion
      - declinar_caso
      - solicitar_mas_info_cliente

  - state: INGESTION
    next_states_allowed: [TRIAGE, CLOSED, EVALUACION_INICIAL]
    required_documents_to_advance:
      - acto_introductivo_demanda
    optional_documents_initial:
      - poder_de_representacion
      - facturas_alegadas
      - requerimientos_previos
      - contrato_original
      - prueba_de_pago_si_aplica
    available_actions:
      - upload_document
      - request_more_documents_from_client
      - approve_documents_complete
      - cancel_case
      - reassign_attorney
      - mark_priority

  - state: TRIAGE
    next_states_allowed: [STRATEGY, INGESTION]
    auto_actions:
      - run_agent_chain: [clasificador_documentos, calculador_plazos_procesales, analizador_riesgo_contractual]
      - require_human_verification_of_extracted_data: true
    output_required:
      - timeline_procesal
      - lista_documentos_faltantes
      - alertas_prescripcion
      - extracted_data_for_review
    available_actions:
      - approve_extracted_data
      - correct_extracted_data
      - request_reanalysis_with_more_docs
      - approve_triage_advance_to_strategy

  - state: STRATEGY
    next_states_allowed: [ACTIVE, CLOSED]
    requires_human_decision: true
    permits_multi_strategy_selection: true  # NUEVO

    available_actions:
      - generate_legal_opinion
      - generate_strategies
      - generate_documents_directly  # skip strategy gen
      - research_jurisprudence
      - select_strategy_and_generate
      - select_multiple_strategies_and_generate  # NUEVO
      - request_more_strategies
      - decline_to_proceed
      - lock_case_for_strategy_review

    on_action_generate_legal_opinion:
      run_agent_chain: [opinion_legal, auditor_trazabilidad_legal]

    on_action_generate_strategies:
      run_agent_chain: [estrategia_litigiosa, investigacion_legal, analizador_jurisprudencia]
      output: estrategias_propuestas (mínimo 3, máximo 7)

    on_action_select_strategy_and_generate:
      transitions_to: ACTIVE
      run_agent_chain: [redactor_demandas, auditor_trazabilidad_legal]

  - state: ACTIVE
    next_states_allowed: [HEARING, JUDGMENT, ACTIVE, CLOSED]
    permits_multi_strategy_execution: true  # NUEVO
    available_actions:
      - generate_additional_document
      - refine_existing_document
      - mark_document_finalized
      - mark_document_submitted_to_court
      - schedule_hearing
      - notify_judgment_received
      - settle_extrajudicial
      - add_new_strategy_in_parallel  # NUEVO
      - record_hearing_outcome

  - state: HEARING
    sub_states:
      - AUDIENCIA_CIVIL
      - AUDIENCIA_INFORMATIVA
    next_states_allowed: [JUDGMENT, ACTIVE]
    available_actions:
      - prepare_for_hearing
      - record_hearing_outcome
      - request_postponement

  - state: JUDGMENT
    next_states_allowed: [APPEAL, EXECUTION, CLOSED]
    auto_calculate_deadlines:
      - CIVIL-APELACION-001
    requires_human_decision: true
    available_actions:
      - file_appeal
      - request_execution
      - accept_judgment
      - generate_judgment_analysis  # NUEVO

  - state: APPEAL
    next_states_allowed: [JUDGMENT, ACTIVE, CLOSED]
    auto_actions:
      - run_agent_chain: [analizador_jurisprudencia, redactor_demandas]
    available_actions:
      - generate_appeal_document
      - mark_appeal_filed
      - record_appellate_outcome

  - state: EXECUTION  # NUEVO
    next_states_allowed: [EXECUTION, CLOSED]
    description: "Post-sentencia firme: ejecución, embargo, cobro de costas"
    available_actions:
      - generate_execution_document
      - record_seizure
      - record_payment_received
      - mark_execution_completed

  - state: CLOSED
    next_states_allowed: [ARCHIVED, ACTIVE]
    available_actions:
      - reopen_case
      - archive_now

  - state: ARCHIVED
    next_states_allowed: []

# Wizard con dos modos: evaluación previa o ingestión directa
intake_wizard:
  modes:
    - evaluacion_inicial:
        target_state: EVALUACION_INICIAL
        skipped_steps_vs_full: [step_2_actors_full]
        intent: "Análisis rápido antes de comprometerse"
    - ingesta_directa:
        target_state: INGESTION
        intent: "Cliente ya contratado, ir directo a trabajar"

  step_1_basic:
    fields:
      - field: title
        type: string
        required: true
      - field: monto_demandado
        type: decimal
        required: true
      - field: territorial_jurisdiction
        type: select
        options: [DO-DN, DO-SD, DO-SJ, DO-PC, DO-NA]
      - field: priority
        type: select
        options: [low, normal, high, critical]
        default: normal
      - field: related_case_search
        type: search
        description: "Buscar casos relacionados (mismo cliente, mismo conflicto)"
        triggers_conflict_check: true

  step_2_actors:
    fields:
      - field: cliente
        type: actor
        required: true
        triggers_conflict_check: true
      - field: contraparte
        type: actor
        required: true
        triggers_conflict_check: true
      - field: abogado_titular
        type: actor
        prefill_from_session: true

  step_3_documents:
    allow_multiple_documents: true  # NUEVO
    required_documents:
      - document_type: acto_introductivo_demanda
        prompt_es: "Sube el acto introductivo (PDF)"
        accepted_formats: [pdf, jpg, png]
        max_size_mb: 20
        triggers_human_verification_of_extracted_data: true
    optional_documents:
      - document_type: poder_de_representacion
      - document_type: facturas_alegadas
      - document_type: contrato_original
      - document_type: requerimientos_previos
      - document_type: prueba_pago

# Cadenas de agentes
agent_chains:
  triage:
    - clasificador_documentos
    - calculador_plazos_procesales
    - analizador_riesgo_contractual
    - auditor_trazabilidad_legal
  strategy_full:
    - estrategia_litigiosa
    - investigacion_legal
    - analizador_jurisprudencia
    - memo_riesgo
    - auditor_trazabilidad_legal
  strategy_opinion_only:
    - opinion_legal
    - auditor_trazabilidad_legal
  active_documentation:
    - redactor_demandas
    - auditor_trazabilidad_legal
  appeal_preparation:
    - analizador_jurisprudencia
    - opinion_legal
    - redactor_demandas
    - auditor_trazabilidad_legal
  execution_preparation:
    - redactor_demandas
    - auditor_trazabilidad_legal

# Auto-snapshots
auto_snapshot_triggers:
  - state_changed
  - strategy_selected
  - document_finalized
  - document_submitted_to_court
  - deadline_overridden

# SLAs
slas:
  triage_max_minutes: 5
  strategy_max_minutes: 15
  document_drafting_max_minutes: 30

compliance:
  requires_attorney_review: true
  retention_years: 10
  legal_disclaimer_locale: es
  ley_91_compliance: true
  conflict_check_required: true

reusable_for:
  - tenant_kind: bank
  - tenant_kind: law_firm

# Notificaciones automáticas
notifications:
  - event: deadline_7_days_away
    severity: warning
    channels: [in_app, email]
  - event: deadline_3_days_away
    severity: high
    channels: [in_app, email, sms]
  - event: deadline_1_day_away
    severity: critical
    channels: [in_app, email, sms]
  - event: state_changed
    severity: info
    channels: [in_app]
  - event: new_document_received
    severity: normal
    channels: [in_app, email]
```

### `config/legal/case_types/recurso_apelacion_civil.yaml`

(Estructura análoga, omitida por brevedad — sigue el mismo patrón con sus deadlines, estados y acciones específicas)

### `config/legal/case_types/caso_penal_imputado.yaml`

```yaml
case_type_id: caso_penal_imputado
version: '1.0.0'

display:
  display_name_es: "Defensa penal — cliente imputado"
  description_es: "Cliente es imputado o detenido. Sistema modela ruta procesal y plazos críticos."
  icon_hint: "shield"
  practice_area_tags_default: ["penal", "procesal"]

applicability:
  jurisdictions: ["do"]
  legal_branches: ["penal"]
  case_severity: "critical"  # libertad personal en juego

# Modo emergencia para detenidos
emergency_mode:
  triggers_when:
    - has_detencion: true
  fast_track_actions:
    - habeas_corpus_template
    - solicitud_revision_medida
  bypass_steps_if_needed:
    - skip_evaluacion_inicial: true

relevant_deadlines:
  - deadline_db_id: PENAL-DETENCION-001
    rationale: "48h presentar a juez de garantías - CRÍTICO"
    auto_check: true
    blocking_if_expired: true
    is_emergency_blocking: true
  - deadline_db_id: PENAL-INVESTIGACION-001
  - deadline_db_id: PENAL-INVESTIGACION-002
  - deadline_db_id: PENAL-INVESTIGACION-003
  - deadline_db_id: PENAL-MEDIDAS-001
  - deadline_db_id: PENAL-MEDIDAS-002
  - deadline_db_id: PENAL-MEDIDAS-003
  - deadline_db_id: PENAL-JUICIO-001
  - deadline_db_id: PENAL-JUICIO-002
  - deadline_db_id: PENAL-APELACION-001
  - deadline_db_id: PENAL-APELACION-002
  - deadline_db_id: PENAL-APELACION-003
  - deadline_db_id: PENAL-PRESCRIPCION-001
  - deadline_db_id: PENAL-PRESCRIPCION-002

states:
  - state: EVALUACION_INICIAL
    description: "Evaluación rápida (skipeable si emergencia)"
    next_states_allowed: [INGESTION, CLOSED]

  - state: INGESTION
    intake_questions:
      - "¿Hay detención en curso ahora mismo?"
      - "¿Hay imputación formal del Ministerio Público?"
      - "¿Hay orden de arresto pendiente?"
      - "Fecha y lugar de los hechos"
      - "¿Cliente conocía a las víctimas?"

  - state: TRIAGE
    auto_actions:
      - run_agent_chain: [clasificador_documentos, calculador_plazos_procesales, investigacion_legal]
    output_required:
      - calificacion_juridica_provisional
      - plazos_criticos_inmediatos
      - alertas_libertad_personal

  - state: STRATEGY
    available_actions:
      - generate_defense_strategies
      - generate_quick_habeas_corpus
      - request_medida_cautelar_alternativa
      - select_strategy_and_generate
      - select_multiple_strategies_and_generate

  - state: ACTIVE
    permits_multi_strategy_execution: true
    parallel_strategies_allowed:
      - defensa_judicial
      - negociacion_con_mp
      - solicitud_medidas_alternativas

  - state: HEARING
    sub_states:
      - AUDIENCIA_MEDIDA_COERCION
      - AUDIENCIA_PRELIMINAR
      - JUICIO_ORAL
      - LECTURA_SENTENCIA

  - state: JUDGMENT
    next_states_allowed: [APPEAL, EXECUTION, CLOSED]
    auto_calculate_deadlines:
      - PENAL-APELACION-001
      - PENAL-APELACION-002
      - PENAL-APELACION-003

  - state: APPEAL

  - state: EXECUTION
    description: "Cumplimiento de pena, libertad condicional, etc."

  - state: CLOSED
  - state: ARCHIVED

intake_wizard:
  step_1_basic:
    fields:
      - field: emergency_situation
        type: boolean
        prompt_es: "¿Hay situación de emergencia (detención en curso)?"
        if_true_skip_to: documents
      - field: title
        type: string
        required: true
      - field: territorial_jurisdiction
        type: select
        options: [DO-DN, DO-SD, DO-SJ, DO-PC]
      - field: hechos_descripcion
        type: text
        max_length: 5000
      - field: fecha_hechos
        type: date
        required: true
      - field: hay_detencion
        type: boolean
      - field: hay_imputacion_formal
        type: boolean
      - field: hay_orden_arresto
        type: boolean

  step_2_actors:
    fields:
      - field: cliente
        type: actor
        required: true
        roles_in_case: [imputado]  # puede tener múltiples
        triggers_conflict_check: true
      - field: abogado_titular
        type: actor
        prefill_from_session: true

  step_3_documents:
    allow_multiple_documents: true
    required_documents:
      - document_type: any_of
        options: [acta_de_arresto, acto_de_imputacion, orden_de_arresto, denuncia_recibida]
        prompt_es: "Sube cualquier documento procesal disponible"

agent_chains:
  triage:
    - clasificador_documentos
    - calculador_plazos_procesales
    - investigacion_legal
    - auditor_trazabilidad_legal
  strategy_emergency:
    - opinion_legal
    - auditor_trazabilidad_legal
  strategy_full:
    - estrategia_litigiosa
    - analizador_jurisprudencia
    - memo_riesgo
    - opinion_legal
    - auditor_trazabilidad_legal
  active_documentation:
    - redactor_demandas
    - auditor_trazabilidad_legal

slas:
  emergency_response_max_minutes: 2  # NUEVO para emergencias
  triage_max_minutes: 10
  strategy_max_minutes: 30

compliance:
  requires_attorney_review: true
  retention_years: 15
  legal_disclaimer_locale: es
  ley_91_compliance: true
  conflict_check_required: true

notifications:
  - event: PENAL-DETENCION-001_24h_away
    severity: critical
    channels: [in_app, email, sms]
  - event: deadline_7_days_away
    severity: warning
    channels: [in_app, email]
  # ... resto análogo
```

(Los YAMLs `caso_penal_victima_querellante` y `caso_penal_evaluacion_general` siguen patrón análogo adaptado a sus roles específicos)

---

## 10. SISTEMA DE ACCIONES POR ESTADO (MENÚ DINÁMICO)

### Concepto

En cada estado del expediente, el sistema NO ejecuta acciones automáticamente excepto cuando el YAML lo marca como `auto_actions`. La mayoría de acciones son **opt-in** disparadas por el abogado.

El frontend obtiene el menú vía `GET /api/v1/legal/cases/{id}/available_actions` que retorna las acciones del YAML según el estado actual.

### Acciones canónicas (no exhaustivo)

```python
# Análisis (no transicionan estado)
generate_legal_opinion              # genera memo legal
generate_strategies                 # genera 3-7 estrategias rankeadas
research_jurisprudence              # búsqueda profunda RAG
analyze_judgment                    # analiza sentencia recibida
generate_judgment_analysis          # análisis de fortalezas/debilidades

# Documentos
generate_document_for_strategy      # confecciona docs de estrategia X
refine_existing_document            # itera sobre borrador existente
mark_document_finalized             # cierra ciclo draft → finalized
mark_document_submitted_to_court    # marca presentación
record_court_acuse_recibo          # registra acuse recibo
generate_additional_document        # nuevo doc adicional

# Estrategias (multi-select permitido)
select_strategy_and_generate        # 1 estrategia
select_multiple_strategies_and_generate  # múltiples paralelas
add_new_strategy_in_parallel        # agregar más después
abandon_strategy                    # marcar abandonada
combine_strategies                  # fusionar 2 en 1

# Plazos
override_deadline                   # override humano con justificación
mark_deadline_completed             # cumplido
extend_deadline                     # prórroga si aplicable
recalculate_deadlines               # forzar recálculo

# Estados
approve_triage_advance              # → STRATEGY
file_appeal                         # → APPEAL
request_execution                   # → EXECUTION
schedule_hearing                    # → HEARING
notify_judgment_received            # → JUDGMENT
settle_extrajudicial                # → CLOSED
reopen_case                         # CLOSED → ACTIVE
archive_now                         # CLOSED → ARCHIVED

# Documentos administrativos
add_private_note                    # anotación del abogado
mark_priority                       # cambiar prioridad
reassign_attorney                   # cambiar titular
share_with_colleague                # compartir lectura

# Issues
report_issue                        # reportar error
resolve_issue                       # marcar resuelto

# Locking
acquire_soft_lock                   # editar
release_lock

# Snapshots
create_manual_snapshot              # snapshot ad-hoc

# Casos relacionados
link_related_case
unlink_related_case
```

### Endpoint dinámico

```
GET /api/v1/legal/cases/{case_id}/available_actions

Response:
{
  "current_state": "STRATEGY",
  "current_sub_state": null,
  "current_user_role": "abogado_titular",
  "available_actions": [
    {
      "action_name": "generate_strategies",
      "display_name": "Generar estrategias",
      "description": "El sistema propone 3-7 estrategias rankeadas",
      "estimated_time_seconds": 120,
      "consumes_llm_tokens": true,
      "requires_confirmation": false
    },
    {
      "action_name": "generate_legal_opinion",
      "display_name": "Generar opinión legal",
      "description": "Memo legal con análisis de la situación",
      "estimated_time_seconds": 30,
      "consumes_llm_tokens": true,
      "requires_confirmation": false
    },
    // ... resto
  ],
  "transitions_available": ["ACTIVE", "CLOSED"]
}
```

---

## 11. ENDPOINTS API EXTENDIDOS (24 endpoints)

| # | Verbo | Path | Propósito |
|---|---|---|---|
| 1 | POST | `/api/v1/legal/cases` | Crear expediente |
| 2 | GET | `/api/v1/legal/cases` | Listar expedientes (filtros) |
| 3 | GET | `/api/v1/legal/cases/{id}` | Detalle completo |
| 4 | POST | `/api/v1/legal/cases/{id}/documents` | Ingestar documento |
| 5 | PATCH | `/api/v1/legal/cases/{id}/documents/{doc_id}` | Transición lifecycle |
| 6 | POST | `/api/v1/legal/cases/{id}/documents/{doc_id}/verify_extracted_data` | Confirmar datos OCR |
| 7 | GET | `/api/v1/legal/cases/{id}/available_actions` | Menú dinámico |
| 8 | POST | `/api/v1/legal/cases/{id}/actions/{action_name}` | Disparar acción |
| 9 | GET | `/api/v1/legal/cases/{id}/timeline` | Timeline eventos |
| 10 | GET | `/api/v1/legal/cases/{id}/deadlines` | Plazos activos |
| 11 | POST | `/api/v1/legal/cases/{id}/deadlines/{deadline_id}/override` | Override plazo |
| 12 | GET | `/api/v1/legal/cases/{id}/strategies` | Listar estrategias |
| 13 | POST | `/api/v1/legal/cases/{id}/strategies/select` | Seleccionar (múltiples) |
| 14 | GET | `/api/v1/legal/cases/{id}/issues` | Listar issues |
| 15 | POST | `/api/v1/legal/cases/{id}/issues` | Reportar issue |
| 16 | PATCH | `/api/v1/legal/cases/{id}/issues/{issue_id}` | Actualizar issue |
| 17 | GET | `/api/v1/legal/cases/{id}/snapshots` | Listar snapshots |
| 18 | GET | `/api/v1/legal/cases/{id}/snapshots/{snapshot_id}` | Detalle snapshot |
| 19 | POST | `/api/v1/legal/cases/{id}/snapshots` | Crear snapshot manual |
| 20 | GET | `/api/v1/legal/cases/{id}/risk` | Risk profile |
| 21 | POST | `/api/v1/legal/cases/{id}/lock` | Adquirir lock |
| 22 | DELETE | `/api/v1/legal/cases/{id}/lock` | Liberar lock |
| 23 | GET | `/api/v1/legal/cases/{id}/related` | Casos relacionados |
| 24 | POST | `/api/v1/legal/cases/{id}/archive` | Archivar |

Headers obligatorios: `X-Tenant-ID: {uuid}`. Sin header → 400.

---

## 12. FRONTEND `/legal/cases`

### Pantallas extendidas (10 vs 7 originales)

```
/legal/cases                      Lista con filtros + risk badges + priority
/legal/cases/new                  Wizard con 2 modos (eval / ingesta directa)
/legal/cases/[id]                 Overview con confidence meter + risk + lock banner
/legal/cases/[id]/timeline        Eventos con decision trace expandible
/legal/cases/[id]/documents       Lista con lifecycle indicators + extracted data review
/legal/cases/[id]/strategy        Multi-select + matrix de estrategias paralelas
/legal/cases/[id]/deadlines       Plazos + modal de override
/legal/cases/[id]/issues          NUEVO - panel de issues
/legal/cases/[id]/risk            NUEVO - risk profile detallado
/legal/cases/[id]/snapshots       NUEVO - lista de snapshots con diff viewer
/legal/cases/[id]/archive         Cierre formal
```

### Componentes clave nuevos

**`CaseConfidenceMeter`** — Indicador visual del score de confianza agregado, con tooltip que muestra factores.

**`CaseRiskBadge`** — Badge de riesgo con colores según `overall_risk_score`.

**`CaseLockBanner`** — Banner cuando otro abogado está editando el caso (soft lock = warning amarillo, hard lock = bloquea inputs).

**`CaseDeadlineOverrideModal`** — Modal para override humano de plazo con campos obligatorios (`reason`, `legal_basis`).

**`CaseStrategyMultiSelect`** — Permite seleccionar múltiples estrategias con tags de "ejecutar en paralelo".

**`CaseDocumentExtractedDataReview`** — Tabla con datos extraídos por OCR + columna editable para correcciones humanas.

**`CaseIssuesPanel`** — Lista de issues con severity, status, asignación.

**`CaseSnapshotsList`** — Lista de snapshots con timestamp, motivo, link a vista de diferencias.

**`CaseDecisionTraceViewer`** — Componente que renderiza decision trace de cualquier evento (debug/audit avanzado).

**`CaseDisasterModeBanner`** — Banner que aparece cuando el sistema entra en modo degradado (sin LLM, sin RAG, etc.).

---

## 13. SISTEMA DE AUDITABILIDAD PROFUNDA

### Componentes

**Snapshots inmutables:**
- Triggered automáticamente en eventos críticos (state change, strategy selection, document finalization, deadline override)
- Almacenan estado completo del expediente en JSONB
- Encadenados criptográficamente (`previous_snapshot_id` + `chained_hash`)
- Permiten reconstruir "qué sabía el abogado en el momento X"
- Inmutables (no UPDATE permitido, solo INSERT)

**Decision trace:**
- Cada output de agente almacena en `legal_case_events.decision_trace`:
  - Inputs exactos que recibió
  - Reglas aplicadas
  - Confidence
  - Alternativas consideradas
  - Chunks de RAG usados
  - Citaciones específicas

**Audit chain:**
- Cada evento tiene `previous_event_id` + `sealed_hash`
- Sealed hash incluye hash del evento previo (chain inmutable)
- Sistema detecta tampering si el chain se rompe

### Endpoints de auditoría

```
GET /api/v1/legal/cases/{id}/snapshots
GET /api/v1/legal/cases/{id}/snapshots/{snapshot_id}
GET /api/v1/legal/cases/{id}/snapshots/{snapshot_id}/diff/{previous_id}
GET /api/v1/legal/cases/{id}/audit_chain_verification  # verifica integridad
```

---

## 14. SISTEMA DE OVERRIDE DE PLAZOS LEGALES

### Concepto

Los plazos calculados automáticamente por `deadline_engine.py` son **propuestas**, no verdad absoluta. El abogado puede overridelos cuando hay realidades jurídicas que el sistema no captura:

- Suspensión por feriado decretado de último momento
- Errores en notificación que invalidan el dies a quo
- Nulidades que reanudan plazos
- Días no laborables imprevistos
- Decisiones del tribunal que extienden plazos

### Implementación

**Tabla:** `legal_case_deadlines.has_human_override` + columnas relacionadas.

**Endpoint:** `POST /api/v1/legal/cases/{id}/deadlines/{deadline_id}/override`

**Body:**
```json
{
  "new_deadline_date": "2026-06-15",
  "reason": "Tribunal decretó suspensión de plazos por feriado del 16 de agosto",
  "legal_basis": "Resolución administrativa SCJ 2026-XYZ"
}
```

**Comportamiento:**
- El plazo automático original NO se borra (`auto_calculated_deadline_date` persiste)
- El override se registra con quién, cuándo, por qué
- `effective_deadline_date` = override si existe, automático si no
- Snapshot automático al hacer override
- Evento de auditoría con decision_trace
- Override se registra en `override_history` (preserva múltiples cambios)

### UI

Modal con campos:
- Nueva fecha (date picker)
- Razón (textarea, mínimo 10 chars)
- Base legal (texto, mínimo 5 chars)
- Confirmación: "Esto modifica un plazo legal. ¿Confirmas?"

---

## 15. SISTEMA DE ISSUES Y ERROR DETECTION

### Tipos de issue

```
wrong_deadline           — Plazo calculado incorrecto
wrong_strategy           — Estrategia propuesta inadecuada
bad_document_generation  — Documento mal redactado
wrong_classification     — Clasificación errónea
missing_data             — Datos faltantes detectados
jurisprudence_outdated   — Jurisprudencia citada obsoleta
agent_failure            — Agente falló en ejecución
data_extraction_error    — OCR extrajo mal
state_machine_violation  — Transición ilegal intentada
conflict_of_interest     — Conflicto detectado
compliance_breach        — Violación compliance
other
```

### Quién puede reportar

- **Agentes** (auto-detect): cuando un agente detecta inconsistencia
- **Sistema** (auto-detect): validaciones automáticas
- **Abogado** (manual): cuando ve un error
- **Cliente** (manual, modo limited): cuando reporta queja

### Resolución y aprendizaje

- Cada issue tiene `assigned_to`, `resolution_notes`, `resolved_at`
- `contributes_to_training: true` permite usar como training data futuro
- `training_label` clasifica para mejora del modelo

### Métricas

Endpoint: `GET /api/v1/legal/cases/_/issues_summary`

Retorna:
- Issues abiertas por tenant
- Issues por tipo
- Tiempo promedio de resolución
- Issues recurrentes (mismo tipo en múltiples casos → indica bug)

---

## 16. RISK ENGINE Y CONFIDENCE LAYER

### Risk Engine

Cada expediente tiene un `risk_profile` calculado por `risk_engine.py`.

**Factores:**
- `probability_of_loss` (0.0-1.0): basado en jurisprudencia + estrategia
- `financial_exposure` (Decimal): monto en juego + costas
- `legal_complexity`: low/medium/high/critical
- `timeline_risk`: low/medium/high/critical (qué tan apretados están los plazos)
- `overall_risk_score` (0.0-1.0): agregado ponderado

**Triggers de recálculo:**
- Cambio de estado
- Nuevo documento crítico
- Override de plazo
- Cambio de estrategia

### Confidence Aggregator

Score agregado de qué tan "completa y confiable" es la información del expediente.

**Factores ponderados:**
- `documents_complete`: ¿están todos los docs requeridos según el YAML?
- `extracted_data_verified`: ¿el abogado verificó los datos extraídos?
- `deadlines_validated`: ¿los plazos están confirmados o usan defaults?
- `strategy_selected`: ¿hay estrategia escogida?
- `actors_complete`: ¿están todos los actores requeridos?
- `conflict_check_done`: ¿se verificó conflicto de interés?

**UI:** Componente `CaseConfidenceMeter` muestra score 0.0-1.0 con desglose en tooltip.

---

## 17. CONCURRENCIA: LOCKING DE EXPEDIENTES

### Estrategia

**Locking optimista, soft por default, hard cuando crítico.**

### Tipos

**Soft lock:**
- Banner visual: "Cesar Soriano está editando este expediente"
- No bloquea inputs, solo advierte
- Si dos personas escriben, last-write-wins con conflict_warning

**Hard lock:**
- Bloquea edición real (inputs deshabilitados)
- Aplicado en operaciones críticas: confección de documentos en paralelo, cambio de estado, override de plazos

### Lifecycle

```
acquire_lock(case_id, scope=soft, duration=5min)
  ↓
client_heartbeat() cada 30s para extender
  ↓
release_lock() o expiración automática
```

### Implementación

- Constraint UNIQUE INDEX por `case_id` donde `released_at IS NULL`
- Servicio `case_lock_manager.py` con TTL
- Frontend hook `useCaseLock` con heartbeat automático

---

## 18. DISASTER MODE Y RESILIENCIA

### Niveles de degradación

```
NORMAL            todo funciona
LLM_DEGRADED      sin LLM (mock o cache), todo lo demás OK
RAG_DEGRADED      sin RAG, agentes funcionan con knowledge pack local
CRITICAL_FALLBACK solo lectura + creación básica de casos sin agentes
```

### Detección automática

`disaster_mode.py` chequea cada 30s:
- LLM endpoint (Anthropic API)
- RAG endpoint (Supabase pgvector)
- Storage (filesystem)
- Database (Supabase Postgres)

Si detecta fallo, transiciona el sistema al nivel apropiado.

### Comportamiento por nivel

**LLM_DEGRADED:**
- Acciones que requieren LLM se deshabilitan en frontend
- Banner: "Sistema operando sin AI. Análisis automático no disponible."
- Abogado puede crear casos, subir docs, ver timeline, gestionar plazos manualmente

**RAG_DEGRADED:**
- Búsqueda de jurisprudencia no funciona
- Agentes que dependen de RAG retornan placeholder con explicación

**CRITICAL_FALLBACK:**
- Solo lectura + crear caso
- Sin orquestación de agentes
- Sin nuevas estrategias generadas
- Sistema queda funcional para "no perder casos" pero sin asistencia inteligente

### UI

`CaseDisasterModeBanner` aparece arriba del header cuando el sistema no está en NORMAL.

---

## 19. NOTIFICACIONES AUTOMÁTICAS

### Engine

`notification_engine.py` ejecuta cron cada hora.

### Eventos que generan notificaciones

```
deadline_30_days_away      info
deadline_14_days_away      info
deadline_7_days_away       warning
deadline_3_days_away       high
deadline_1_day_away        critical
deadline_expired           critical

new_document_received      normal
state_changed              info
strategy_completed         info

new_issue_critical         critical
agent_failure_recurrent    high

lock_taken_over            warning
```

### Canales

- `in_app`: notificación en la UI
- `email`: vía servicio externo (futuro)
- `sms`: vía servicio externo (futuro)
- `webhook`: para integraciones externas

### Cron jobs

```
scripts/legal/expedientes/notify_upcoming_deadlines.py    # cada hora
scripts/legal/expedientes/notify_new_documents.py         # cada 5min
scripts/legal/expedientes/snapshot_critical_state_changes.py  # event-driven
```

---

## 20. PLAN DE IMPLEMENTACIÓN — 5 SUB-FASES

### Sub-fase 2.1 — Infraestructura DB + Schemas Pydantic (4 días)

**Worker:** Claude Code
**Repo:** `nadakki-ai-suite`

**Entregables:**
- 10 migraciones SQL en `db/migrations/legal_phase2/`
- Schema completo Pydantic v2 (`schemas_expedientes.py`)
- Persistencia CRUD básica (`persistencia_expedientes.py`)
- RLS policies aplicadas
- Adapter SQLite para desarrollo local
- Tests unitarios de schemas + RLS

**Acceptance:**
- 8 tablas creadas en Supabase y SQLite
- RLS impide cross-tenant queries
- pytest 100% pass
- No rompe tests existentes

### Sub-fase 2.2 — Servicios Core + Endpoints + 1 Tipo de caso (5 días)

**Worker:** Claude Code
**Repo:** `nadakki-ai-suite`

**Entregables:**
- Servicios:
  - `case_loader.py`, `case_state_machine.py`, `case_orchestrator.py`
  - `deadline_engine.py`, `deadline_override.py`
  - `document_intake.py`, `document_lifecycle.py`, `document_association.py`
  - `data_extraction_review.py`
  - `strategy_engine.py` (con multi-strategy)
  - `decision_trace.py`
  - `event_emitter.py`
- 24 endpoints API
- YAML completo `defensa_civil_cobro_pesos.yaml`
- Tests integración del flujo cobro de pesos
- Tests cross-tenant (BLOQUEANTE)

**Acceptance:**
- Crear caso vía POST retorna 201
- Subir documento dispara cadena correctamente
- Cross-tenant isolation: 0 leaks
- Multi-strategy: seleccionar 2 estrategias paralelas funciona
- Override de plazos funciona end-to-end
- Verificación humana de OCR funciona
- Latencia p95 < 5s

### Sub-fase 2.3 — Servicios Avanzados (3 días)

**Worker:** Claude Code
**Repo:** `nadakki-ai-suite`

**Entregables:**
- `risk_engine.py`
- `confidence_aggregator.py`
- `case_snapshots.py` (con cadena criptográfica)
- `case_issues_service.py`
- `case_lock_manager.py`
- `case_relations_service.py`
- `notification_engine.py`
- `disaster_mode.py`
- Endpoints adicionales
- Tests unitarios + integración

**Acceptance:**
- Snapshots crean cadena verificable
- Risk profile se calcula correctamente
- Confidence score < 1.0 cuando datos faltan
- Lock optimista funciona (soft + hard)
- Issues se reportan y resuelven
- Disaster mode degrada elegantemente

### Sub-fase 2.4 — Frontend `/legal/cases` (5 días)

**Worker:** Cursor
**Repo:** `nadakki-dashboard`

**Entregables:**
- 10 páginas en `app/(forge)/legal/cases/`
- Todos los componentes de la sección 8
- Hooks
- Types TS espejo Pydantic
- i18n strings ES
- Tests de cada componente principal

**Acceptance:**
- `npm run build` PASS
- `/legal/cases` lista renderiza casos reales
- Wizard crea caso end-to-end
- Multi-strategy selector funciona
- Override modal funciona
- Issues panel funciona
- Confidence meter renderiza
- Snapshots list muestra historial
- Disaster mode banner aparece cuando aplica
- Lock banner cuando otro usuario edita
- 100% strings en español
- Lighthouse a11y ≥ 95

### Sub-fase 2.5 — Tipos restantes + Tests E2E + Go/No-Go (4 días)

**Workers:** Claude Code (YAMLs) + Cursor (ajustes UI) + Manus (tests + reporte)

**Entregables:**
- YAML `recurso_apelacion_civil.yaml`
- YAML `caso_penal_imputado.yaml`
- YAML `caso_penal_victima_querellante.yaml`
- YAML `caso_penal_evaluacion_general.yaml`
- Catálogo `motivos_apelacion_civil_rd.yaml`
- Recovery strategies YAML
- Adaptaciones del wizard si los nuevos tipos requieren campos extra
- Tests E2E de los 5 flujos
- Reporte Go/No-Go Fase 2

**Acceptance:**
- Los 5 tipos de caso funcionan end-to-end
- Manus produce reporte Go/No-Go con 22 gates

**Total Fase 2: 21 días corridos.**

---

## 21. ASIGNACIÓN DE WORKERS

| Sub-fase | Días | Claude Code | Cursor | Manus |
|---|---|---|---|---|
| 2.1 (4d) | DB + schemas | ✓ | — | — |
| 2.2 (5d) | Servicios core + endpoints + caso 1 | ✓ | — | Tests cross-tenant último día |
| 2.3 (3d) | Servicios avanzados | ✓ | — | — |
| 2.4 (5d) | UI completa | — | ✓ | — |
| 2.5 (4d) | YAMLs + tests E2E + reporte | ✓ | Ajustes | Tests + reporte Go/No-Go |

**Paralelización:**
- 2.4 (Cursor) puede arrancar día 6 con fixtures hasta que endpoints estén listos
- 2.5 (Manus) puede preparar fixtures de tests desde día 1

---

## 22. ACCEPTANCE CRITERIA (gate Go/No-Go Fase 2)

| # | Criterio | Bloqueante |
|---|---|---|
| 1 | Cross-tenant isolation 0 leaks (RLS + tests) | SÍ |
| 2 | Schema Super Agent v3.2.0 en outputs | SÍ |
| 3 | `requiere_revision_abogado: true` en cada output | SÍ |
| 4 | Disclaimer Ley 91 ES en UI y metadata | SÍ |
| 5 | Plazos calculados según `computation_rule` | SÍ |
| 6 | Aritmética de plazos validada con casos JSON | SÍ |
| 7 | Override de plazos funciona con justificación obligatoria | SÍ |
| 8 | Estados solo transicionan según máquina | SÍ |
| 9 | Documentos lifecycle: draft→submitted funciona | SÍ |
| 10 | Verificación humana de OCR antes de cálculo de plazos | SÍ |
| 11 | Multi-strategy: 2+ estrategias en paralelo funcionan | SÍ |
| 12 | Snapshots inmutables con cadena criptográfica | SÍ |
| 13 | Decision trace en cada evento de agente | SÍ |
| 14 | Issues system: reportar + resolver | SÍ |
| 15 | Risk profile se calcula y persiste | SÍ |
| 16 | Confidence score agregado correcto | SÍ |
| 17 | Locking: soft + hard funciona sin race conditions | SÍ |
| 18 | Disaster mode degrada elegantemente | SÍ |
| 19 | Notificaciones de plazos próximos | SÍ |
| 20 | Documentos encriptados Fernet | SÍ |
| 21 | Logs sin PII | SÍ |
| 22 | `MOCK_LLM=true` por default | SÍ |
| 23 | Build PASS, tests PASS | SÍ |
| 24 | UI 100% español | SÍ |
| 25 | Latencia p95 < 5s sin LLM real | NO (warning) |
| 26 | Audit chain inmutable verificable | SÍ |
| 27 | Lighthouse a11y ≥ 95 | NO (warning) |

---

## 23. RIESGOS Y MITIGACIÓN

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| 1 | Attorney no firma YAMLs a tiempo | Media | Alto | YAMLs van con `validated: false`. Sistema funciona pilot. |
| 2 | Cómputo plazos off-by-one | Alta | Crítico | 80+ tests con casos del JSON |
| 3 | Multi-strategy crea inconsistencias | Media | Alto | Tests específicos de paralelismo |
| 4 | Snapshots crecen mucho en storage | Alta | Medio | Compresión gzip + retention policy |
| 5 | Override de plazos sin justificación | Baja | Alto | Validación obligatoria server-side |
| 6 | Lock contention en alta concurrencia | Media | Medio | Soft default + TTL agresivo (5min) |
| 7 | Decision trace expone PII en logs | Media | Crítico | Sanitization layer + tests específicos |
| 8 | Disaster mode falsos positivos | Media | Bajo | Hysteresis: requiere 3 fallos consecutivos |
| 9 | Issues system se llena de spam | Baja | Bajo | Rate limit + auto-deduplication |
| 10 | Risk engine con datos insuficientes | Alta | Medio | Default to "unknown" si datos < 50% |
| 11 | Documentos pesados rompen FastAPI | Media | Medio | Streaming + 20MB límite |
| 12 | Cross-tenant leak en snapshots | Media | Crítico | RLS + `tenant_id` redundante |
| 13 | Migración SQLite rompe por tipos | Alta | Bajo | Adapter con `_ensure_column` |
| 14 | Vercel build timeout | Baja | Bajo | Lazy load + incremental |
| 15 | Manus tests demasiado costosos | Media | Bajo | Marker `@pytest.mark.integration` |
| 16 | YAML obsoleto sin aviso | Alta | Medio | Cron 90d que avisa |
| 17 | Notificaciones spam el usuario | Media | Bajo | Configurables por user + tenant |
| 18 | Race condition en confidence calc | Baja | Medio | Recalc con lock optimista |
| 19 | Audit chain se rompe | Baja | Crítico | Verification cron + alert |
| 20 | Sub-tipos penales confusos | Media | Medio | Wizard claro con preguntas guiadas |

---

## CIERRE

Spec v2.0.0 con cero deuda técnica. Cubre los 25 huecos identificados:

**Críticos (8):** menú de acciones STRATEGY, iteración estrategias, lifecycle docs, asociación doc-expediente, verificación OCR humana, sub-tipos penales, notificaciones, multi-strategy.

**Importantes (7):** EVALUACION_INICIAL, acciones administrativas, eventos programados, plazos vencidos al ingresar, motivos apelación parametrizados, modo emergencia penal, sub-estados penales.

**Auditabilidad/Resiliencia (10):** snapshots inmutables, decision trace, issues system, risk engine, confidence layer, locking, disaster mode, related cases, conflict check, audit chain verification.

**Tiempo total:** 21 días corridos / 3 semanas calendario considerando fines de semana.

**Siguiente paso operativo:** entrega de los 5 prompts ejecutables (uno por sub-fase) listos para pegar a cada worker.

Fin del spec v2.0.0.
