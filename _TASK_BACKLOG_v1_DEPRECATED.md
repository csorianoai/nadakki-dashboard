# ⚠️ DEPRECATED 2026-05-09 — superseded by `_TASK_BACKLOG_v2.md`

> **DEPRECATION NOTICE**
>
> Este documento es la versión 1 del backlog de Nadakki Forge Credit Hub. Quedó **deprecado el 2026-05-09** porque asumía un proyecto greenfield, mientras que el sistema real estaba en **Phase 9 V3 validation completada** (2026-05-02). Las 30 tareas P0-P3 listadas abajo están done, canceladas por deferral, o sustituidas por construcción paralela documentada en `app/(forge)/credit-hub/_design/`.
>
> **Para el backlog activo, ver:** [`_TASK_BACKLOG_v2.md`](./_TASK_BACKLOG_v2.md)
>
> **Para el razonamiento del pivot, ver:** [`_SESSION_PIVOT_REASONING_2026-05-09.md`](./_SESSION_PIVOT_REASONING_2026-05-09.md)
>
> **Conserved for historical reference.** No iniciar trabajo nuevo basado en este documento.

---

# _TASK_BACKLOG.md — NADAKKI FORGE CREDIT HUB
## Backlog priorizado para Cowork
### Fuente: NADAKKI_FORGE_MASTER_REDESIGN_PROMPT_v3 + Sprint 6 Master Prompt

---

## CÓMO LEER ESTE BACKLOG

| Campo | Significado |
|---|---|
| **ID** | Identificador único — úsalo en commits y reportes |
| **Prioridad** | P0 (bloqueante) → P3 (nice-to-have) |
| **Persona** | DEALER / BANK / SHARED |
| **Estado** | TODO / IN_PROGRESS / DONE / BLOCKED |
| **Estimación** | Tiempo aproximado para Cowork |
| **DoD** | Definition of Done — criterios verificables |

**Reglas de ejecución:**
1. Trabaja en orden de prioridad — P0 primero, luego P1, etc.
2. Dentro de la misma prioridad, sigue el orden listado
3. NO saltes una tarea porque "parece más fácil otra"
4. Si una tarea está BLOCKED, ve a la siguiente NO bloqueada
5. Marca el estado en este mismo archivo después de cada tarea

---

# 🔴 P0 — FUNDACIÓN (sin esto, no hay nada)

## P0-01 · Auditoría Forge actual
- **Persona:** SHARED
- **Estado:** TODO
- **Estimación:** 60 min
- **Tarea:** Listar todo lo que existe hoy en el frontend relacionado a Credit / Forge
- **DoD:**
  - [ ] Crear `_design/AUDIT.md` con:
    - File tree de `app/credit/` y `app/(forge)/` si existe
    - Lista de TODOS los hex codes hardcodeados (grep `#[0-9a-fA-F]{3,8}`)
    - Lista de TODAS las font-family / font-size variations
    - Lista de TODOS los border-radius
    - Lista de patrones "card" diferentes (debería haber 1, no 5)
    - Lista de patrones "button" diferentes
    - Lista de patrones "table" diferentes
    - Lista de hardcoded `credicefi` / `Banco Piloto` / UUIDs
    - Lista de `console.log`, `TODO`, `FIXME`
  - [ ] Mínimo 30 hallazgos
  - [ ] Commit: `chore(forge): audit before redesign — N hallazgos`

## P0-02 · Crear design tokens
- **Persona:** SHARED
- **Estado:** TODO
- **Estimación:** 90 min
- **Tarea:** Implementar el sistema de tokens CSS de la spec Forge v3
- **DoD:**
  - [ ] Crear `app/(forge)/credit-hub/_design/tokens.css` con TODOS los tokens del spec (colores, tipografía, espaciado, radii, sombras)
  - [ ] Cargar fuentes vía `next/font`: Source Serif 4 (display) + Inter (body) + JetBrains Mono
  - [ ] Actualizar `tailwind.config.ts` para consumir las CSS variables
  - [ ] Wire `[data-tenant]` selector hooks
  - [ ] Agregar `prefers-reduced-motion` media query
  - [ ] `npm run build` pasa
  - [ ] Visitar `/credit-hub` muestra las CSS variables en DevTools
  - [ ] Commit: `feat(forge): design tokens v1.0`

## P0-03 · Layout shell (Sidebar + Topbar)
- **Persona:** SHARED
- **Estado:** TODO (depende de P0-02)
- **Estimación:** 2 hrs
- **Tarea:** Construir el shell de navegación que envuelve todo Forge
- **DoD:**
  - [ ] `components/forge/layout/Sidebar.tsx` (collapsible, persona-aware)
  - [ ] `components/forge/layout/Topbar.tsx` (search, notifications, tenant switcher, user menu)
  - [ ] `app/(forge)/credit-hub/layout.tsx` con `TenantThemeProvider`
  - [ ] Sidebar tiene 2 modos: BANK (8 secciones) y DEALER (3 secciones) según el spec Part 6.1/6.2
  - [ ] Topbar tiene Cmd+K placeholder (CommandPalette se hace en P1)
  - [ ] Tema cambia cuando alternas `[data-tenant]` manualmente en DevTools
  - [ ] Commit: `feat(forge): layout shell sidebar+topbar`

---

# 🟠 P1 — COMPONENTES BASE (orden de Phase 2 del spec)

## P1-01 · Button + IconButton
- **Persona:** SHARED
- **DoD:**
  - [ ] `components/forge/ui/Button.tsx` con variantes: `primary | secondary | ghost | danger | link`
  - [ ] Tamaños: `sm | md | lg`
  - [ ] Loading state (spinner inline, label visible)
  - [ ] Leading/trailing icon support
  - [ ] Focus ring visible (3px brand-500 outline)
  - [ ] `IconButton` separado para uso solo-icono con aria-label requerido
  - [ ] Storybook page en `/credit-hub/_design/preview/button` con todas las variantes/estados
  - [ ] Commit: `feat(forge): Button + IconButton`

## P1-02 · Input + Textarea + Select
- **DoD:**
  - [ ] `components/forge/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx`
  - [ ] Estados: default, focus, error, disabled
  - [ ] Error con `aria-describedby`
  - [ ] Label asociado vía htmlFor
  - [ ] Commit: `feat(forge): form fields base`

## P1-03 · Checkbox + RadioGroup + Switch
- **DoD:** mismo patrón, accesibles, en preview page

## P1-04 · Card + EmptyState
- **DoD:**
  - [ ] Card con `border-subtle + shadow-xs` por default
  - [ ] EmptyState con: icono, título, descripción, CTA opcional
  - [ ] **NUNCA** card con `box-shadow: 0 20px 40px ...` (eso es Dribbble)

## P1-05 · Badge + StatusPill
- **DoD:**
  - [ ] Badge para counts/labels neutrales
  - [ ] StatusPill con variantes semánticas (success/warning/danger/info/neutral)
  - [ ] Pill SIEMPRE incluye icono + texto (nunca color solo)

## P1-06 · Skeleton + Avatar

## P1-07 · Modal + Drawer
- **DoD:**
  - [ ] Focus trap implementado
  - [ ] Esc para cerrar
  - [ ] Return focus al trigger al cerrar
  - [ ] Animation 240ms exacto, no más

## P1-08 · Toast (sonner)
- **DoD:** `npm i sonner` (si no está), wire global toaster

## P1-09 · Tabs + Breadcrumb

## P1-10 · DataTable ⭐ (90 min — la más crítica)
- **DoD COMPLETO:**
  - [ ] Sticky header con `position: sticky` semántico
  - [ ] Row height: 48px desktop / 56px mobile
  - [ ] Cell padding 12px 16px
  - [ ] NO zebra striping (Goldman doesn't stripe)
  - [ ] Hover: background `--forge-surface-sunken`
  - [ ] Sort indicators: chevron, brand-500 active / ink-400 inactive
  - [ ] Numeric cols: text-align right, tabular-nums
  - [ ] Status col: usa StatusPill, nunca raw text
  - [ ] Empty state: full-width row con `<EmptyState>`
  - [ ] Loading: 5 skeleton rows (no spinner)
  - [ ] Pagination server-side controlada
  - [ ] Density toggle: comfortable / compact / dense, persisted in localStorage
  - [ ] Mobile: cards en lugar de tabla bajo 768px
  - [ ] Commit: `feat(forge): DataTable v1.0`

## P1-11 · KpiCard + EvidenceCard ⭐
- **DoD EvidenceCard (signature component):**
  - [ ] Muestra: tipo de evidencia (badge), descripción, score de confianza, fuente, timestamp
  - [ ] Variantes para: SIC income evidence, AML alert, fraud signal, document validation
  - [ ] Expandable detail con audit drilldown
  - [ ] Commit: `feat(forge): EvidenceCard signature component`

## P1-12 · AuditTimeline + CommandPalette
- **DoD:** CommandPalette usa `cmdk` library, comandos básicos: navigate, search, new app

## P1-13 · MoneyInput + DateInput + ConsentCapture
- **DoD:** locale-aware (Intl.NumberFormat / Intl.DateTimeFormat), nunca hardcoded `RD$`

---

# 🟡 P2 — HERO PAGES (orden Phase 4 del spec)

## P2-01 · `/credit-hub/bank` — Bank Dashboard
- **Persona:** BANK
- **Estimación:** 2 hrs
- **DoD:**
  - [ ] Header serif: "Pending review · 7 applications" (no marketing copy)
  - [ ] 4 KpiCards: Pending review, Approved this week, AML alerts, Avg decision time
  - [ ] Section: "Recent activity" con AuditTimeline (últimos 10 eventos)
  - [ ] Section: "Risk signals" con EvidenceCards de las top 3 applications de mayor riesgo
  - [ ] Datos REALES del API (no mocks)
  - [ ] Commit: `feat(forge): bank dashboard`

## P2-02 · `/credit-hub/bank/applications` — List
- **Persona:** BANK
- **Estimación:** 2 hrs
- **DoD:**
  - [ ] Filter bar: Status, Risk, Date range, Search
  - [ ] Filtros persistidos en URL query params
  - [ ] DataTable con: APP ID, Applicant, Amount, Status, Risk, Created, Actions
  - [ ] Server-side pagination
  - [ ] Bulk approve/reject con confirmación modal
  - [ ] Click row → drawer con preview rápido (NO navega aún)

## P2-03 · `/credit-hub/bank/applications/[id]` — Detail ⭐⭐⭐
- **Persona:** BANK
- **Estimación:** 4 hrs (la página más importante del producto)
- **DoD:**
  - [ ] Header: APP-XXXX-YYYY-ZZZZ + actions [Reject] [Approve]
  - [ ] Subheader: "Submitted 2 days ago by Auto Plaza · DOP 850,000"
  - [ ] Status pill + Risk pill
  - [ ] Tabs: Overview · Documents · AI Evidence · Audit · Comments
  - [ ] Layout 12-col grid: contenido 8 cols / side panel 4 cols
  - [ ] Tab "AI Evidence" muestra mínimo 3 EvidenceCards (income, AML, fraud)
  - [ ] Tab "Audit" muestra AuditTimeline completo
  - [ ] Acciones [Approve]/[Reject] con modal de confirmación + razón
  - [ ] Commit: `feat(forge): application detail — bank view`

## P2-04 · `/credit-hub/dealer` — Dealer Dashboard
- **Persona:** DEALER
- **Estimación:** 90 min
- **DoD:**
  - [ ] Saludo personal: "Hi Carlos. Let's get someone approved today."
  - [ ] CTA gigante: `[+ New application]`
  - [ ] KpiCard row: Drafts · Submitted · Approved · This month total
  - [ ] DataTable: My active applications (compacta, status-focused)
  - [ ] Mobile-first (dealer usa phone en showroom)

## P2-05 · `/credit-hub/dealer/applications/new` — Wizard 5 pasos ⭐⭐
- **Persona:** DEALER
- **Estimación:** 4 hrs
- **DoD:**
  - [ ] 5 steps separados como route segments (back-button safety)
  - [ ] Step 1: Applicant (todos los campos de ApplicantDataRD)
  - [ ] Step 2: Co-borrower (opcional)
  - [ ] Step 3: Vehicle (con cálculo de LTV en vivo)
  - [ ] Step 4: Documents (upload con preview)
  - [ ] Step 5: Consent (checkboxes Ley 172-13 + firma digital)
  - [ ] Auto-save draft cada 10s
  - [ ] Navigate-away modal: "Save draft and exit?"
  - [ ] Confirmation screen final con APP ID + ETA
  - [ ] Mobile: full-screen, sticky bottom nav
  - [ ] Commit: `feat(forge): dealer wizard 5 steps`

## P2-06 · `/credit-hub/dealer/applications/[id]` — Status Detail
- **Persona:** DEALER
- **Estimación:** 90 min
- **DoD:**
  - [ ] Read-only (dealer no edita)
  - [ ] Timeline visual del estado
  - [ ] Si hay ofertas: tabla comparativa Banco A vs Banco B
  - [ ] Calculadora interactiva (slider plazo → cuota)
  - [ ] Botón "Select this offer" en la oferta preferida

## P2-07 · `/credit-hub/bank/audit` — Audit Trail
- **Persona:** BANK
- **DoD:** DataTable con eventos del audit log, filterable, exportable a CSV

## P2-08 · `/credit-hub/bank/compliance` — AML/KYC + Regulatory
- **Persona:** BANK
- **DoD:** Tabs para AML alerts, KYC verifications, Regulatory reports

---

# 🔵 P3 — POLISH + REUSABILITY VALIDATION

## P3-01 · Microinteracciones tuned
- Hover states sutiles, focus states verificados, skeletons sobre spinners

## P3-02 · Toast notifications wired
- Save success, save error, action confirmation

## P3-03 · Empty states crafted (tenant-aware copy)

## P3-04 · CommandPalette completo
- Todos los routes, search applications, switch tenant, sign out

## P3-05 · Reusability test — fake third tenant
- Crear tenant ficticio "TestBank Mexico" con brand_primary rojo, locale es-MX, currency MXN
- Toda la UI debe cambiar SIN tocar código
- Documentar en `_design/REUSABILITY_TEST.md` con screenshots

## P3-06 · Documentación final
- `_design/README.md`, `TOKENS.md`, `COMPONENTS.md`, `PAGES.md`, `MIGRATION.md`, `CHANGELOG.md`

---

# ⚪ ANTI-PATTERNS — BUILD-REJECTING

Si Cowork hace cualquiera de esto, el commit se rechaza:

1. ❌ Hex code hardcodeado dentro de componente
2. ❌ `if (tenant_id === 'credicefi')` cualquier lugar
3. ❌ `border-radius: 12px` (o cualquier valor fuera de tokens)
4. ❌ Dos implementaciones diferentes de tabla
5. ❌ Glassmorphism, neon glow, animated gradients
6. ❌ `box-shadow: 0 20px 40px ...` (Dribbble aesthetic)
7. ❌ Spinner donde skeleton funciona
8. ❌ Modal sin focus trap
9. ❌ Status comunicado solo por color
10. ❌ Currency sin locale formatting
11. ❌ `console.log` en production
12. ❌ TODO sin ticket linkeado
13. ❌ TypeScript con `any`
14. ❌ Más de 3 font weights en una página
15. ❌ Sidebar nav item sin icono
16. ❌ Empty state sin CTA

---

# 📊 PROGRESO

| Fase | Total tareas | Completadas | Estado |
|---|---|---|---|
| P0 — Fundación | 3 | 0 | 🔴 Pendiente |
| P1 — Componentes | 13 | 0 | 🔴 Pendiente |
| P2 — Hero pages | 8 | 0 | 🔴 Pendiente |
| P3 — Polish | 6 | 0 | 🔴 Pendiente |
| **TOTAL** | **30** | **0** | **0%** |

Cowork: actualiza este conteo después de cada tarea.

---

# 🚦 REGLA FINAL

**No hay "shortcuts".** Si una tarea P1 te parece "ya casi lista" pero falta un detalle del DoD → no la marques DONE. La calidad es la única forma de que un banco pague $8k/mes por esto.

**Si hay duda, paras y preguntas.** Improvisar = 0 puntos. Preguntar = 100 puntos.
