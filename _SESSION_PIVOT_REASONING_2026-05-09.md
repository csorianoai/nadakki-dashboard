# _SESSION_PIVOT_REASONING_2026-05-09.md
## Razonamiento detrás del pivot del backlog

**Fecha:** 2026-05-09
**Autor:** Cowork (sesión inaugural Nadakki Forge)
**Producto del pivot:** [`_TASK_BACKLOG_v2.md`](./_TASK_BACKLOG_v2.md)
**Backlog original archivado:** [`_TASK_BACKLOG_v1_DEPRECATED.md`](./_TASK_BACKLOG_v1_DEPRECATED.md)

---

## 1. Contexto inicial

El kickoff prompt de la sesión instruyó a Cowork ejecutar `_TASK_BACKLOG.md` empezando por **P0-01 · Auditoría Forge actual** — una tarea greenfield que asumía:

- No existe carpeta `_design/`
- No existe audit previo
- `app/(forge)/credit-hub/` puede o no estar implementado
- Componentes Forge no existen aún
- Hay que producir `_design/AUDIT.md` con ≥30 hallazgos desde cero

Cesar después aclaró durante el arranque que `/credit-hub/*` ya tiene rutas completas (bank, dealer, applications, audit, compliance, components, preview, wizard 5 pasos), y que P0-01 debía auditar y mejorar lo existente, no crear desde cero.

## 2. Hallazgo crítico que provocó la pausa

Durante exploración inicial del repo (Glob de `**/credit-hub/**/*.tsx` y `**/_design/**/*`), Cowork detectó evidencia de que el proyecto está mucho más avanzado que lo que el backlog asume:

1. **Ya existe `_design/AUDIT.md`** dated 2026-04-29 (10 días antes de hoy), branch `feat/forge-redesign-v3`. 50 hallazgos numerados. Referenciado desde `_design/README.md` como "Phase 0 baseline audit (drift, anti-patterns vs v3.2)".

2. **Ya existe TODA la documentación que P3-06 dice producir:** README, DESIGN_SYSTEM, COMPONENTS, TOKENS, PAGES, MIGRATION, POLISH, REUSABILITY_TEST, TOKEN_MIGRATION_MAP, TENANT_CONTEXT_EXTENSION, TENANT_THEMING (ES), HOW_TO_MODIFY (ES), REUSE_PLAYBOOK (ES), PHASE9_V3_VALIDATION, PHASE_8_ACCEPTANCE, BLOCKER_phase1.5, CROSS_CORE_FINDINGS — 18 docs `.md` total.

3. **Ya existe `_design/tokens.css`** (P0-02 supuestamente "TODO") en `app/(forge)/credit-hub/_design/tokens.css`.

4. **Ya existen TODOS los componentes signature de P1** en `components/forge/ui/`: 28 primitivos incluyendo Button, Card, DataTable, EvidenceCard, KpiCard, AuditTimeline, CommandPalette, MoneyInput, DateInput, ConsentCapture, MicroChart.

5. **Ya existen TODAS las hero pages de P2.**

6. **Ya existen layout shells** — múltiples versiones (ForgeAppShell, ForgeCreditHubAppShell, ForgeAppSidebar/ForgeCreditHubSidebar, etc.). **Esto es un anti-pattern de duplicación real**.

7. **Ya existen benchmarks visuales descargados** (`_assets/benchmarks/`): Goldman Marquee, Brex, Stripe, Linear, Bloomberg, Notion. Y screenshots de 9 hero pages × desktop+mobile. Y reportes Lighthouse a11y/full.

8. **Hay deuda técnica conocida y documentada:** README dice textualmente: *"Legacy `components/credit-hub/**` primitives remain in production behind the Forge shell (Phase 7.2 Case B); they are not part of the documented design system."*

9. **Hay carpeta legacy adicional `app/credit/`** (paralela a `app/(forge)/credit-hub/`) con páginas vivas que el spec del kickoff prompt no menciona.

Aplicando la **Regla 12 del `_DESIGN_SYSTEM_RULES.md`** ("Si dudas si algo cumple las reglas → NO lo hagas. Pregunta. Improvisar = riesgo. Preguntar = profesionalismo"), Cowork paró antes de ejecutar P0-01 y reportó las 4 opciones siguientes a Cesar.

## 3. Las 4 opciones presentadas a Cesar

### Opción A — Audit DELTA detallado
- Preservar `AUDIT.md` Phase 0 como histórico
- Crear `_design/AUDIT_DELTA_2026-05-09.md` que compara: estado actual del código vs lo documentado en docs existentes
- Foco en: drift desde Phase 9, duplicación legacy/forge no resuelta, deuda en `app/credit/`, anti-patterns nuevos post-Phase 9
- **Tiempo:** 90-120 min
- **Output:** punto de partida para decidir qué tareas P1/P2 del backlog siguen vigentes vs cuáles están done vs cuáles pivotan

### Opción B — Audit literal (overwrite)
- Sobreescribir `AUDIT.md` con audit fresco siguiendo el DoD del backlog
- **Tiempo:** 90 min
- **Riesgo:** contradice docs existentes que referencian el AUDIT.md viejo; pierde historial Phase 0

### Opción C — Re-priorización del backlog (ELEGIDA)
- En vez de audit, leer PHASE9_V3_VALIDATION + MIGRATION + POLISH + COMPONENTS para entender qué está done
- Proponer un backlog REVISADO que refleje el estado real (P0/P1 mayormente done, P2 mayormente done, foco real = consolidar legacy + cerrar Phase 7.2 Case B + completar Phase 8 + lo que falte de Phase 9)
- **Tiempo:** 60 min
- **Output:** `_SESSION_PIVOT.md` con el backlog ajustado para que Cesar decida

### Opción D — Continuar literal pero a otra ubicación
- Hacer audit fresco en `_design/AUDIT_v2_cowork.md` (no toca el viejo)
- Ejecutar el DoD del backlog tal cual (≥30 hallazgos)
- **Tiempo:** 90 min
- **Coexisten** dos audits, Cesar decide cuál es el "vigente"

### Voto de Cowork
**A o C**. Ambas reconocen que el verdadero blocker no es un audit greenfield sino la duplicación legacy + el estado real del proyecto.

## 4. Decisión de Cesar (turno de chat 2026-05-09)

**Voto: Opción C primero, luego decidimos si A es necesaria.**

**Razonamiento de Cesar:**
> "Tu análisis revela algo que yo no sabía: hay docs Phase 0/7/8/9 que ya documentan el estado. Hacer audit greenfield sin leerlos es malgastar tiempo. C te da el mapa del terreno en 60 min antes de decidir si auditar."

Cesar amplió el scope con un DoD específico para una tarea bautizada **P0-01-REVISADA · Pivot Assessment + Backlog Revisado** — ver detalle en el chat de la sesión.

## 5. Ejecución de Opción C

Cowork ejecutó la lectura ordenada de:

1. PHASE9_V3_VALIDATION.md — confirmó 6 layers shipped (L1, L2, L3, L5, L6, L7), L4 intencionalmente skipped
2. MIGRATION.md — confirmó Phase 7.2 Case B (legacy permanente) + dealer wizard cleanup deferral
3. POLISH.md — confirmó Phase 5 Items 1-5 todos GREEN, Phase 6 reusability GREEN, Phase 7 cleanup GREEN, Phase 9 v3 con UN solo TODO explícito (MicroChart real series)
4. COMPONENTS.md — catálogo de 28 primitivos en `components/forge/ui/*` + DEFERRED TO PHASE 8 sobre persona desde TenantContext (no cerrado)
5. AUDIT.md Phase 0 completo — 50 hallazgos baseline (la mayoría mitigados por Phases 2-9 vía construcción paralela en `components/forge/*`)
6. PAGES.md — 9 hero routes documentadas con layout, components, hooks, screenshots
7. PHASE_8_ACCEPTANCE.md — 3 acceptance tests PASS (cold-start comprehension, tenant onboarding sim, fork plan)
8. BLOCKER_phase1.5.md — UUID resolution canónica
9. CROSS_CORE_FINDINGS.md — UUID conflict identificado, fuera de Forge scope, deferred a backend reconciliation sprint

Plus exploración spot:
- `app/(forge)/credit-hub/page.tsx` — homepage Forge importa del legacy `components/credit-hub/` (no del canónico `components/forge/ui/`)
- `app/credit/page.tsx` — confirma legacy mode-picker estilo consumer (purple/blue/emerald, emojis 🤖🏦⚡)

**Tiempo total:** 75 min lectura + 20 min redacción = 95 min (dentro target 60-90, ligero overflow por amplitud del DoD).

## 6. Output: `_SESSION_PIVOT.md` (renombrado a `_TASK_BACKLOG_v2.md`)

El doc producido contiene:

- **A.** Resumen ejecutivo (estado por Phase + pendientes reales)
- **B.** Top 5 deuda crítica con evidencia (B1 triple capa Forge, B2 layout shell duplicado, B3 `app/credit/*` no documentado, B4 persona via URL deferred, B5 `useTenantConfig` no fetcha)
- **C.** Backlog revisado: 30/30 tareas originales marcadas como completadas + 8 tareas nuevas P10-01 a P10-08
- **D.** Resumen de tareas DONE
- **E.** Tareas NUEVAS críticas con ranking de impacto
- **F.** Recomendación: Opción 1 = P10-08 (mapa) → P10-05 (tenant_branding)
- **G.** Notas de proceso

## 7. Decisión final de Cesar (turno de chat siguiente)

**Voto: opción (a) con ajuste de orden — mergear pivot y arrancar con P10-05 PRIMERO, no P10-08.**

**Razonamiento de Cesar:**
> "El bug más caro del sistema es 'useTenantConfig siempre devuelve default' — eso convierte el multi-tenant en TEATRO. Mi pregunta original al iniciar era 'queremos crearlo reusable para múltiples instituciones financieras'. Si tenant_branding no fetchea live, NO ERES REUSABLE — solo lo aparentas.
>
> P10-05 (3-4 hrs) convierte multi-tenant de teatro a real y desbloquea el VALOR DIFERENCIAL del producto. P10-08 (resolution map) sirve después para guiar limpieza, pero si no arreglamos el teatro, ningún mapa importa."

**Acciones inmediatas instruidas:**

1. Renombrar `_SESSION_PIVOT.md` → `_TASK_BACKLOG_v2.md` con bloque VERSIONING NOTES al inicio
2. Renombrar `_TASK_BACKLOG.md` → `_TASK_BACKLOG_v1_DEPRECATED.md` con header DEPRECATED
3. Crear este doc (`_SESSION_PIVOT_REASONING_2026-05-09.md`) con el análisis de las 4 opciones
4. Crear branch `feat/forge-cowork-2026-05-09-pivot`
5. Commit local (sin push) con mensaje `docs(forge): pivot backlog to v2 — Phase 9 ground truth`
6. Esperar OK de Cesar tras revisar header del v2 antes de pushear

**Secuencia de trabajo aprobada para hoy:**
1. Renames + v2 commit local (~10 min)
2. Cesar aprueba el v2
3. P10-05 — Live tenant_branding fetch (3-4 hrs) con workflow visual completo del playbook (mockup HTML antes de TSX)
4. (Si queda tiempo) P10-07 quick wins (CSS basura globals.css)
5. P10-08 (resolution map) → próxima sesión

## 8. Por qué este doc existe (meta)

Este `_SESSION_PIVOT_REASONING_2026-05-09.md` queda en repo como evidencia auditable de:

- Qué se descubrió durante el inicio de sesión y por qué se paró
- Las 4 opciones consideradas y su trade-off
- Quién decidió qué (Cesar) y con qué razonamiento
- Por qué el backlog original quedó deprecado (no por error, sino por desactualización vs realidad)

Sirve para:
- **Próximas sesiones de Cowork:** entender el pivot sin volver a hacer la lectura completa
- **Cualquier ingeniero que vea v2 y pregunte "¿por qué hay un v2?":** este doc responde
- **Cesar:** historial de decisiones con razonamiento explícito

---

*Fin del documento de razonamiento. Continuación operacional: ver [`_TASK_BACKLOG_v2.md`](./_TASK_BACKLOG_v2.md) y la sesión Cowork del 2026-05-09 a partir de P10-05.*
