# _TASK_BACKLOG_v2.md — Nadakki Forge Credit Hub
## Backlog operativo (v2 — pivot a estado real Phase 9)

---

## VERSIONING NOTES

| Campo | Valor |
|---|---|
| **Versión** | v2 |
| **Fecha de creación** | 2026-05-09 |
| **Reemplaza a** | [`_TASK_BACKLOG_v1_DEPRECATED.md`](./_TASK_BACKLOG_v1_DEPRECATED.md) |
| **Razón del v2** | El backlog original (v1) asumía un proyecto greenfield (P0 audit, P1 construcción de primitivos, P2 hero pages desde cero, P3 polish + docs final). El sistema real está en **Phase 9 V3 validated** (2026-05-02): Phases 0/1.5/2/3/4/5/6/7.1/7.2/8/9 todas DONE o GREEN según docs vivos en `app/(forge)/credit-hub/_design/`. **Las 30 tareas P0-P3 del v1 están done, canceladas por deferral, o sustituidas por construcción paralela documentada.** Continuar con v1 = duplicar trabajo y sobreescribir docs vigentes. |
| **Razonamiento del pivot** | [`_SESSION_PIVOT_REASONING_2026-05-09.md`](./_SESSION_PIVOT_REASONING_2026-05-09.md) — historial de las 4 opciones evaluadas (A/B/C/D), decisión de Cesar (Opción C), ejecución por Cowork, y reordenamiento posterior (P10-05 antes de P10-08) |
| **Producido por** | Cowork (sesión inaugural Nadakki Forge, 2026-05-09) |
| **Aprobado por** | Cesar Soriano · CTO Nadakki AI Suite (revisión pendiente al momento del rename) |
| **Status del backlog v2** | DRAFT pendiente de revisión final de Cesar antes de push a `feat/forge-cowork-2026-05-09-pivot` |

**Cambios estructurales vs v1:**
- Eliminadas las secciones P0/P1/P2/P3 originales (quedan referenciadas como "P-COMPLETADAS" en sección C como evidencia de done)
- Nueva sección P10 con 8 tareas que el v1 no contemplaba pero que el estado real requiere
- Top 5 deuda crítica detectada documentada en sección B con evidencia
- Recomendación de orden de ejecución en sección F (ajustada por Cesar: P10-05 antes de P10-08)

**Quién debe leer este doc:**
- Cualquier nueva sesión Cowork sobre Nadakki Forge — empieza por aquí, no por v1
- Engineers nuevos al proyecto — para entender qué pendientes son reales y cuáles son ruido histórico
- Cesar — para tracking de progreso real

---

> **Propósito:** Reconciliar el `_TASK_BACKLOG.md` original (escrito asumiendo greenfield) con el estado real del repo (Forge en Phase 9 V3 validation, no Phase 0). Sirve como base para decidir qué trabajar hoy.
>
> **Qué NO toqué al producir el pivot:** Cero archivos de código. Solo lecturas + este doc nuevo.

---

## A. Resumen ejecutivo (1 página)

El proyecto Forge Credit Hub está mucho más adelantado de lo que asume el `_TASK_BACKLOG.md` original. El equipo previo (branch `feat/forge-redesign-v3`) ejecutó **Phase 0 (audit) → Phase 9 V3 validation** entre 2026-04-29 y 2026-05-02, y dejó documentación viva en `app/(forge)/credit-hub/_design/` (18 docs `.md` + benchmarks descargados + screenshots desktop/mobile + reportes Lighthouse a11y).

### Estado por Phase (lo que la documentación afirma)

| Phase | Tema | Estado documentado | Evidencia |
|---|---|---|---|
| **0** | Audit baseline | **DONE** (2026-04-29) | `_design/AUDIT.md` — 50 hallazgos numerados sobre estado pre-Forge |
| **1.5** | Tenant ID blocker (`DEFAULT_CREDIT_TENANT_ID`) | **RESOLVED** (2026-05-01) | `_design/BLOCKER_phase1.5.md` — UUID `0a91ee98-…` confirmado canonical |
| **2** | 28 primitives en `components/forge/ui/*` | **DONE** | `_design/COMPONENTS.md` — catálogo completo con DO/DON'T por primitivo |
| **3** | App shell (`ForgeCreditHubAppShell` + sidebar + topbar) | **DONE** | `app/(forge)/credit-hub/layout.tsx` lo monta |
| **4** | A11y / Lighthouse gates | **DONE** ≥ 0.95 en /credit-hub/preview | `_inventory/lh-*-a11y*.json` — score 0.97 sostenido |
| **5** | Polish: hover/focus/disabled/loading + toast + empty + cmd palette | **GREEN** (Items 1-5) | `_design/POLISH.md` — todos GREEN |
| **6** | Reusability test con tercer tenant ficticio (TestBank Mexico) | **GREEN** | `_design/REUSABILITY_TEST.md` + screenshots `_inventory/reusability-test/` |
| **7.1** | `framer-motion` removido del runtime | **DONE** | `lib/motion-stub.tsx` shim, bundle delta documentado |
| **7.2** | Legacy `components/credit-hub/**` adapter — Case B (queda permanente) | **CLOSED** | `tailwind.config.js` LEGACY ALIASES marcado PERMANENT, `_inventory/credit_hub_consumers_grep.txt` |
| **8** | Docs ES (TENANT_THEMING, HOW_TO_MODIFY, REUSE_PLAYBOOK) + acceptance tests | **PASS** (3/3 tests) | `_design/PHASE_8_ACCEPTANCE.md` — 2026-05-02 |
| **9 V3** | Hybrid Intelligent — calibrated typography + KPI iconography + sidebar gradient + microcharts | **PASS Q1-Q6** (excepto L4 page transitions, intencional) | `_design/PHASE9_V3_VALIDATION.md` — 6 commits SHA listados |

### Lo que SÍ está pendiente (extraído de los docs vigentes)

1. **MicroChart en `/credit-hub/bank` consume mock series** — POLISH.md línea 343: *"Replace with a real analytics hook (e.g. `useBankVolumeSeries`) when the API exposes daily aggregates; keep `prefers-reduced-motion`."*
2. **Persona deriva de URL segments, no de TenantContext** — COMPONENTS.md línea 68-80 (DEFERRED TO PHASE 8): `creditHubPersonaFromLayoutSegments()` sigue activo; el target era persona derivado de `TenantContext` (Path A/B en `TENANT_CONTEXT_EXTENSION.md`). No hay evidencia de que se haya completado.
3. **Legacy `WizardContainer` co-existe** — MIGRATION.md: Forge wizard de 5 segmentos es la URL de producción, pero el legacy `WizardContainer.tsx` (7 steps) sigue en repo, referenciado por unit tests. Decisión pendiente: borrar + reescribir tests, o mantener como ruta "preview" QA-only.
4. **`useTenantConfig` no hace fetch real** — AUDIT.md hallazgo #4.3: el hook siempre devuelve el `getDefaultTenantBankingConfig()`. Sin fetch al endpoint `/api/v2/tenants/{id}/branding` documentado en `_API_CONTRACT.md`. Bloquea "zero-deploy onboarding" real.
5. **CSS basura en `globals.css` línea ~5882** — reportada por Cesar durante el build de hoy.
6. **Legacy `app/credit/*` co-existe con `app/(forge)/credit-hub/*`** — `app/credit/` tiene 9 page.tsx vivos (page, [id], bank, bank/[applicationId], dealer, dealer/[applicationId], dealer/new, new, status/[applicationId]) usando estética antigua (purple/blue/emerald, emojis 🤖🏦⚡, "AI Underwriting" mode-picker). NO está documentado en PAGES.md como legacy, NO está en MIGRATION.md como deprecación. Status real: ¿activo? ¿deprecación silenciosa?

---

## B. Top 5 deuda crítica (mi diagnóstico, con evidencia)

### B1 · Triple capa de "Forge" components confunde al equipo
**Evidencia:**
- `components/forge/ui/*` — la canonical (Phase 2): Button, Card, DataTable, EvidenceCard, KpiCard, etc. (28 primitivos)
- `components/credit-hub/primitives/*` — primitivos LEGACY pero llamados también "Forge*": `ForgeBadge.tsx`, `ForgeButton.tsx`, `ForgeCard.tsx`, `ForgeInput.tsx`, `ForgeProgress.tsx`, `ForgeSelect.tsx`, `ForgeSkeleton.tsx`. **El homepage `/credit-hub` (`app/(forge)/credit-hub/page.tsx`) todavía importa de aquí**, no del canónico.
- `components/credit/forge/*` — una **TERCERA** familia con prefijo "forge" (AiReadinessPanel, ApplicationStatusBadge, BankUnderwritingHero, CreditHeroShell, CreditMetricCard, DealerCommandHero, DecisionSnapshotCard, PremiumEmptyState, VehicleShowcaseCard, WizardProgressRail). Naming sugiere otra iteración de migración nunca consolidada.

**Por qué importa:** Un nuevo dev que lea "import ForgeCard" no sabe cuál importar. Anti-pattern #4 del `_DESIGN_SYSTEM_RULES.md`: "Dos implementaciones de tabla → Inconsistencia". Aquí hay TRES familias paralelas. Phase 7.2 documenta solo el caso 1↔2.

**Impacto:** Tech debt + drift visual silencioso + tiempo perdido en code review.

### B2 · Layout shell duplicado en 5+ variantes
**Evidencia:** `components/forge/layout/` contiene:
- `Sidebar.tsx` + `Topbar.tsx` (genéricos, para preview según COMPONENTS.md)
- `ForgeAppShell.tsx` + `ForgeAppSidebar.tsx` + `ForgeAppTopbar.tsx`
- `ForgeCreditHubAppShell.tsx` + `ForgeCreditHubSidebar.tsx` + `ForgeCreditHubTopbar.tsx`
- `ForgeCommandPaletteContext.tsx` + `ForgeCreditHubCommandPalette.tsx`

Plus `BankSideNav.tsx` + `BankTopBar.tsx` en `components/credit-hub/bank/navigation/` (legacy).
Plus `DealerBottomNav.tsx` + `DealerTopBar.tsx` en `components/credit-hub/navigation/` (legacy).

**Por qué importa:** Solo `ForgeCreditHubAppShell` está montado en producción (verificado en `layout.tsx`). El resto es código sin call-sites o "preview-only". Riesgo: divergencia accidental + bundle size + onboarding confuso.

### B3 · `app/credit/*` como ruta legacy no documentada
**Evidencia:** 9 `page.tsx` vivos bajo `app/credit/` con estilo consumer-app (purple-100 / emerald-100 / blue-100, emojis hex `\u{1F916}` 🤖). El root `app/credit/page.tsx` muestra un mode-picker "AI Underwriting" / "Bank Submission" / "Hybrid" que parece predecesor del flujo Forge. **NO** aparece en `PAGES.md` ni en `MIGRATION.md`. **NO** se sabe si está deprecado, en uso por algún tenant, o si es feature flag.

**Por qué importa:** Si está deprecado pero accesible, contamina la experiencia. Si está en uso, hay deuda de migración invisible. Necesita decisión + acción explícita.

### B4 · Persona deriva de URL, no de Tenant — deferred desde Phase 8 sin cierre
**Evidencia:** `COMPONENTS.md` línea 70: *"Persona (`bank` | `dealer`) fed to `PersonaProvider` is derived from `useSelectedLayoutSegments()` via `creditHubPersonaFromLayoutSegments()`... This **does not** meet the stricter 'no URL-derived persona' guardrail from the Phase 3 brief."*

El doc `TENANT_CONTEXT_EXTENSION.md` documenta Path A/B. No encontré evidencia (POLISH.md ni PHASE9_V3_VALIDATION.md) de que se haya cerrado el refactor. Riesgo aceptado, pero es deuda real.

**Por qué importa:** Si un tenant agrega un tercer persona (admin, customer), o si el routing cambia, persona-detection se rompe. La regla #10 del design system es "Tenant-agnostic by default" y persona via URL viola eso parcialmente.

### B5 · `useTenantConfig` no hace fetch real → multi-tenant es teatro
**Evidencia:** `AUDIT.md` Phase 0 §4.3 (sin cambio en docs posteriores): *"Returns `getDefaultTenantBankingConfig(tenantId || 'tenant-no-disponible')` via `useMemo` — always the default object, keyed only by `tenantId`; **no API fetch** observed in this hook for live `tenant_branding` / backend config."*

`_API_CONTRACT.md` documenta `GET /api/v2/tenants/{tenant_id}/branding` con response shape completo (logo_url, brand_primary, brand_dark, locale, currency, regulatory_profile, application_status_labels, copy_overrides). El hook no lo consume.

**Por qué importa:** El sistema de design tokens y el `[data-tenant]` switching están construidos para soportar onboarding sin deploy. Sin fetch real, ese principio (Regla #10 del design system + filosofía del producto) no se cumple end-to-end. Es el bloqueador principal para "$8k/mes por tenant" funcional.

---

## C. Backlog REVISADO (v2 propuesta)

Reescribo el backlog reflejando el estado real. Conservo el formato original (Persona / Estado / Estimación / DoD / Commit). Tareas marcadas **DONE** ya están completadas en branches mergeados a `main`; tareas **NEW** no estaban en el backlog original.

### 🟢 P-COMPLETADAS — no re-ejecutar

| ID original | Equivalencia real | Notas |
|---|---|---|
| P0-01 | `_design/AUDIT.md` (Phase 0, 50 hallazgos) | Auditar otra vez = duplicar trabajo |
| P0-02 | `_design/tokens.css` + `next/font` (Inter, JetBrains Mono, Space Grotesk via `app/(forge)/layout.tsx`) | ⚠️ AUDIT.md hallazgo #19: usa **Space Grotesk**, no **Source Serif 4** spec'd. **Verificar antes de cerrar oficial.** |
| P0-03 | `ForgeCreditHubAppShell` + `ForgeCreditHubSidebar` + `ForgeCreditHubTopbar` + `PersonaProvider` + `ForgeCommandPaletteContext` | Done con caveat B2 (5+ variants) y B4 (URL-derived persona) |
| P1-01 | `Button` + `IconButton` (`components/forge/ui/`) | Phase 5 Item 2 Group 2 GREEN |
| P1-02 | `Input` + `Textarea` + `Select` | Phase 5 Item 2 Group 1 GREEN |
| P1-03 | `Checkbox` + `RadioGroup` + `Switch` | Phase 5 Item 2 Group 1 GREEN |
| P1-04 | `Card` + `EmptyState` (con `tone="success"`) | Phase 5 Item 4 GREEN |
| P1-05 | `Badge` + `StatusPill` | Phase 5 GREEN |
| P1-06 | `Skeleton` + `Avatar` | Phase 5 Item 2 Group 3 GREEN |
| P1-07 | `Modal` + `Drawer` (con `closeOnBackdropClick`) | Phase 5 Item 2 Group 5 GREEN |
| P1-08 | `Toast` (Sonner via `ForgeToaster`) | Phase 5 Item 3 GREEN, locale-aware vía `forge-toast-copy.ts` |
| P1-09 | `Tabs` + `Breadcrumb` | Phase 5 Item 2 Group 4 GREEN |
| P1-10 | `DataTable` ⭐ | Phase 5 Item 2 Group 3 + Phase 9 L7 (compact density default, Bloomberg-grade) |
| P1-11 | `KpiCard` + `EvidenceCard` ⭐ | Phase 9 L2 + L6 (KpiCard sin count-up, microinteractions sweep) |
| P1-12 | `AuditTimeline` + `CommandPalette` (cmdk + ⌘K) | Phase 5 Item 5 GREEN, EN/ES copy via `forge-palette-copy.ts` |
| P1-13 | `MoneyInput` + `DateInput` + `ConsentCapture` | Phase 5 Item 2 Group 1 GREEN |
| P2-01 | `/credit-hub/bank` dashboard | Phase 9 L1 (calibrated hero typography) + L3 (insights microcharts) |
| P2-02 | `/credit-hub/bank/applications` lista con URL `q`/`status`/`density` | Phase 5 Item 1 GREEN, Lighthouse a11y 1.0 |
| P2-03 | `/credit-hub/bank/applications/[applicationId]` detail (`BankApplicationDetailView`) | Done; tabs + EvidenceCard + Drawer + decisión panel |
| P2-04 | `/credit-hub/dealer` dashboard | Done con hero + KPI |
| P2-05 | Wizard 5 pasos `/credit-hub/dealer/applications/new/{applicant,co-borrower,vehicle,documents,consent,complete}` | Done (5-segment Forge wizard); ⚠️ legacy `WizardContainer` co-existe (B1) |
| P2-06 | `/credit-hub/dealer/applications/[applicationId]` detail | Done, según PAGES.md |
| P2-07 | `/credit-hub/bank/audit` AuditTimeline | Done |
| P2-08 | `/credit-hub/bank/compliance` con success-tone empty | Done |
| P3-01 | Microinteracciones | Phase 5 Item 2 + Phase 9 L6 (shadow elevation, no decorative motion) |
| P3-02 | Toast notifications wired (8 flows) | Phase 5 Item 3 GREEN |
| P3-03 | Empty states (8 surfaces) | Phase 5 Item 4 GREEN |
| P3-04 | CommandPalette completo | Phase 5 Item 5 GREEN |
| P3-05 | Reusability test third tenant (TestBank Mexico) | Phase 6 GREEN |
| P3-06 | Documentación final (READMEs, TOKENS, COMPONENTS, MIGRATION, etc.) | Phase 8 — 18 docs en `_design/` (EN técnico + ES operacional) |

**Conclusión: 30/30 tareas del backlog original ya están completadas o canceladas vía decisión documentada (D, E del Phase 7 historical deferrals).**

---

### 🔴 P10 — DEUDA REAL (lo que el backlog original NO contempla)

#### P10-01 · Wire MicroChart a hook real (NEW · explícito de POLISH.md)
- **Persona:** BANK · **Estado:** TODO · **Estimación:** 60-90 min
- **Tarea:** En `app/(forge)/credit-hub/bank/page.tsx` (Insights row), reemplazar las series mock estáticas que consume `MicroChart` por un hook nuevo `useBankVolumeSeries` (o equivalente que consuma agregados diarios del backend).
- **DoD:**
  - [ ] Verificar que existe endpoint backend que sirva agregados diarios; si no, abrir `_API_REQUEST.md` y bloquear
  - [ ] Crear `lib/credit-hub/hooks/useBankVolumeSeries.ts` siguiendo patrón react-query de `_API_CONTRACT.md`
  - [ ] Sustituir series mock; preservar `prefers-reduced-motion` behavior (Phase 9 L3 / MicroChart)
  - [ ] Smoke test visual + Lighthouse a11y `/credit-hub/bank` ≥ 0.95
  - [ ] Commit: `feat(forge): wire MicroChart to real bank volume series`

#### P10-02 · Resolver triple capa "Forge" components (NEW · B1)
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 2 hrs análisis + 4 hrs ejecución (en sub-tareas)
- **Tarea:** Auditar y consolidar las tres familias `components/forge/ui/*` (canonical), `components/credit-hub/primitives/*` (legacy "Forge*"), y `components/credit/forge/*` (tercera capa).
- **DoD:**
  - [ ] Producir `_design/_inventory/forge_triplication_audit.md` con: cada componente "Forge*", su ubicación, sus call-sites (grep), y veredicto: KEEP / REPLACE-WITH-CANONICAL / DELETE
  - [ ] Para cada REPLACE: PR separado (un componente a la vez) reemplazando call-sites al canonical
  - [ ] Para cada DELETE: confirmar zero call-sites + tests verdes + commit dedicado
  - [ ] Update `_design/MIGRATION.md` con sección "Phase 10 — Forge consolidation" describiendo la decisión por componente
  - [ ] Commit final: `chore(forge): consolidate Forge primitive layers — N components migrated, M deleted`

#### P10-03 · Decidir destino de `app/credit/*` legacy (NEW · B3)
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 2-4 hrs según decisión
- **Tarea:** Determinar si `app/credit/*` (9 page.tsx) está activo, si tiene tenants en producción usándolo, o si es deprecación silenciosa.
- **DoD:**
  - [ ] Cesar confirma uso real (analytics, support tickets, tenants enterprise)
  - [ ] Decisión documentada en `_design/MIGRATION.md` sección "Phase 10 — `app/credit/*` disposition"
  - [ ] Si DEPRECATE: 301 redirects de `/credit/*` → `/credit-hub/*` correspondientes + delete code en commit dedicado
  - [ ] Si KEEP: documentar en `PAGES.md` como "Legacy — co-existence policy" + nota visible en cada page (banner "This view is deprecated — use [link]")
  - [ ] Commit: `chore(legacy): decide app/credit disposition — <decisión>`

#### P10-04 · Cerrar B4 — Persona desde TenantContext, no URL (NEW · explícito de COMPONENTS.md)
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 2 hrs
- **Tarea:** Implementar Path A o Path B documentado en `_design/TENANT_CONTEXT_EXTENSION.md` para que `PersonaProvider` reciba persona desde `TenantContext` (o auth-derived role), no desde `useSelectedLayoutSegments()`.
- **DoD:**
  - [ ] Decidir A vs B con Cesar (probable B: `ForgeBrandingProvider` para no tocar `TenantContext` que sirve a otros cores)
  - [ ] Implementar; eliminar `creditHubPersonaFromLayoutSegments()` del shell
  - [ ] Regression: `/credit-hub/bank` y `/credit-hub/dealer` siguen mostrando navegación + `data-portal` correctos
  - [ ] Lighthouse a11y sin regresión
  - [ ] Update `_design/COMPONENTS.md` línea 68-80 (ya no es "DEFERRED")
  - [ ] Commit: `refactor(forge): persona from tenant context — close Phase 8 deferral`

#### P10-05 · Implementar fetch real en `useTenantConfig` (NEW · B5 — el bloqueador #1 para multi-tenant real) ⭐ PRÓXIMA
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 3-4 hrs
- **Tarea:** Reemplazar `getDefaultTenantBankingConfig()` por fetch real al endpoint `GET /api/v2/tenants/{tenant_id}/branding` documentado en `_API_CONTRACT.md`. Cache con react-query, fallback al default actual cuando offline/error.
- **DoD:**
  - [ ] Verificar que el endpoint backend está implementado y responde el shape de `_API_CONTRACT.md`. Si no, abrir `_API_REQUEST.md` y bloquear
  - [ ] Crear `useTenantBranding` hook con react-query, queryKey `['tenant-branding', tenantId]`, staleTime razonable (ej. 5min)
  - [ ] Wire CSS variables vía `style` prop en `ForgeCreditHubAppShell` o layout: `--forge-brand-500: branding.brand_primary` etc.
  - [ ] Status pill labels desde `branding.application_status_labels` en vez de hardcoded
  - [ ] Test manual con tenant override flag (`NEXT_PUBLIC_FORGE_TEST_TENANT=mx`) verificando que el fetch dispara y los colores cambian
  - [ ] Update `_design/TENANT_THEMING.md` removiendo nota "SQL marked illustrative pending real `tenant_branding` schema"
  - [ ] **Workflow visual obligatorio (per `_DESIGN_TOOLS_PLAYBOOK.md` para componentes signature):** mockup HTML del estado loading + error + success ANTES de codear el TSX. Cesar aprueba mockup. Claude Code escribe TSX desde mockup aprobado. Cowork integra.
  - [ ] Commit: `feat(forge): live tenant branding fetch — multi-tenant zero-deploy enabled`

#### P10-06 · WizardContainer cleanup (NEW · explícito de MIGRATION.md)
- **Persona:** DEALER · **Estado:** TODO · **Estimación:** 90 min
- **Tarea:** Decidir y ejecutar cleanup del legacy `components/credit-hub/dealer/wizard/WizardContainer.tsx` (7-step animated wizard) que ya no se monta en producción pero sigue referenciado por unit tests.
- **DoD:**
  - [ ] Decisión Cesar: DELETE (reescribir tests contra Forge wizard) o KEEP-PREVIEW (ruta `/credit-hub/_preview/wizard-legacy` solo QA)
  - [ ] Si DELETE: reescribir `tests/credit-hub/content/wizard/WizardContainer.test.tsx` apuntando al Forge wizard, luego `rm` del archivo legacy
  - [ ] Verificar zero call-sites: `grep -r "WizardContainer" app/ components/`
  - [ ] Update `_design/MIGRATION.md` cerrando deferral
  - [ ] Commit: `chore(forge): wizard cleanup — <decisión>`

#### P10-07 · Cleanup CSS basura `globals.css` línea ~5882 (NEW · reportado por Cesar)
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 30 min
- **Tarea:** Identificar y limpiar el CSS basura en `globals.css` alrededor de línea 5882 reportado durante el build de hoy.
- **DoD:**
  - [ ] Leer rango y determinar el bloque basura completo
  - [ ] Eliminar; verificar que ningún componente referencia clases del rango
  - [ ] `npm run build` + smoke test `/credit-hub/preview`
  - [ ] Commit: `chore(forge): remove dead CSS from globals.css`

#### P10-08 · Backlog operativo: re-validar Phase 0 hallazgos contra estado actual (NEW · diferencia entre AUDIT.md y código actual)
- **Persona:** SHARED · **Estado:** TODO · **Estimación:** 90 min
- **Tarea:** El `AUDIT.md` Phase 0 listó 50 hallazgos. POLISH/MIGRATION/PHASE9 cierran muchos pero no marcan cuáles. Producir delta para saber cuáles siguen abiertos.
- **DoD:**
  - [ ] Crear `_design/AUDIT_PHASE0_RESOLUTION.md` con tabla: hallazgo # | descripción corta | estado actual (RESOLVED/PARTIAL/STILL-OPEN) | evidencia
  - [ ] Mínimo confirmar: #11 (CrediCefi hardcoded, supuestamente resuelto en Phase 7.5), #19 (Source Serif 4 vs Space Grotesk — ⚠️ probable still open), #23 (rounded-2xl widespread — verificar si solo en legacy o también en forge/ui), #34 (stale IA), todos los del bloque "12. TODO/FIXME/console"
  - [ ] Commit: `docs(forge): audit Phase 0 resolution map`

---

## D. Tareas que YA estaban DONE (resumen)

**100% del backlog original (30 tareas)** corresponde a trabajo ya ejecutado y validado en docs vivos. Detalle en sección C tabla "P-COMPLETADAS".

**No hay** tareas del backlog original que estén PARTIAL o BLOCKED dentro del scope del backlog. Todo lo que queda son tareas NUEVAS (P10-*) que el backlog no contemplaba pero que el estado real requiere.

---

## E. Tareas NUEVAS críticas (resumen, ranking de impacto)

| ID | Título | Impacto si no se hace |
|---|---|---|
| **P10-05** ⭐ | Live `tenant_branding` fetch | Multi-tenant es teatro — bloquea valor diferencial del producto |
| **P10-02** | Triple capa Forge consolidation | Tech debt acumulándose con cada PR; código nuevo importa la familia equivocada |
| **P10-03** | Disposition `app/credit/*` | Confusión + esfuerzo duplicado en bug fixes en dos sistemas |
| **P10-01** | MicroChart real series | UX bank dashboard es "demo" — banker pregunta "qué datos son" en demo y rompe credibilidad |
| **P10-04** | Persona desde TenantContext | Deuda menor pero rompe regla "Tenant-agnostic by default" del design system |
| **P10-08** | Phase 0 resolution map | Sin esto, no sabemos honestamente cuántas anti-patterns siguen vivas |
| **P10-06** | WizardContainer cleanup | Bajo impacto runtime, alto valor higiénico (test suite + repo cognitive load) |
| **P10-07** | globals.css cleanup | Bajo impacto, fix higiénico |

---

## F. Recomendación de orden de ejecución (REVISADA por Cesar 2026-05-09)

**Decisión final de Cesar (overriding la propuesta original A→C):** **P10-05 PRIMERO, no P10-08.**

> *Razonamiento de Cesar:* "El bug más caro del sistema es 'useTenantConfig siempre devuelve default' — eso convierte el multi-tenant en TEATRO. Si tenant_branding no fetchea live, NO ERES REUSABLE — solo lo aparentas. P10-05 (3-4 hrs) convierte multi-tenant de teatro a real y desbloquea el VALOR DIFERENCIAL del producto. P10-08 (resolution map) sirve después para guiar limpieza, pero si no arreglamos el teatro, ningún mapa importa."

### Secuencia operativa para HOY (2026-05-09)

1. **(en curso)** Renames + v2 + branch + commit local (~10 min)
2. Cesar revisa y aprueba `_TASK_BACKLOG_v2.md`
3. **P10-05 — Live tenant_branding fetch (3-4 hrs)** — workflow visual completo del playbook obligatorio: mockup HTML loading + error + success ANTES de TSX, aprobación de Cesar, Claude Code para conversión, Cowork integra
4. (Si queda tiempo) **P10-07 quick wins** — CSS basura globals.css cleanup
5. **P10-08 (resolution map)** — diferido a próxima sesión

### Próximas sesiones (sugerencia)

| Sesión | Bloque sugerido |
|---|---|
| Sesión 2 | P10-08 (resolution map) → P10-04 (persona refactor) |
| Sesión 3 | P10-02 (Forge triplication consolidation — análisis primero, después PRs por componente) |
| Sesión 4 | P10-03 (`app/credit/*` disposition — depende de input de Cesar sobre uso real) |
| Sesión 5 | P10-06 (WizardContainer cleanup) + P10-01 (MicroChart real series — depende de endpoint backend) |

---

## G. Notas de proceso

1. **No creé branch nueva** (`feat/forge-cowork-2026-05-09`) durante el pivot porque la shell de Linux estaba arrancando. Branch correcto para esta sesión: **`feat/forge-cowork-2026-05-09-pivot`** (instruido por Cesar).
2. **Cero código tocado** durante producción del v2. Solo lecturas (4 archivos de coordinación + 9 docs `_design/*.md` + 3 page.tsx para validar IA + Globs masivos para mapear file tree).
3. **Tiempo invertido en este pivot:** ~75 min de lectura + 20 min de redacción inicial + ~15 min de iteración v1→v2 con headers (dentro del target 60-90 min, ligero overflow por amplitud del DoD).
4. **Próximo paso operativo:** Cesar revisa header VERSIONING NOTES (sección al inicio de este doc), aprueba el push de `feat/forge-cowork-2026-05-09-pivot`, y entonces arrancamos P10-05 con workflow visual.

---

*Fin del backlog v2. Para razonamiento del pivot, ver [`_SESSION_PIVOT_REASONING_2026-05-09.md`](./_SESSION_PIVOT_REASONING_2026-05-09.md). Para el backlog original (deprecado), ver [`_TASK_BACKLOG_v1_DEPRECATED.md`](./_TASK_BACKLOG_v1_DEPRECATED.md).*
