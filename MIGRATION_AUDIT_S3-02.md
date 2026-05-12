# S3-02 — SIC Phase 1 Forge migration audit

**Scope:** Top 5 SIC routes (25% of 20-page SIC surface).  
**Reference:** `app/(forge)/legal/cases/page.tsx` (zinc typography, violet–indigo primary CTA, `border-zinc-800`).

## Shared chrome (layout + barra)

Updates apply to all SIC routes but were driven by Phase 1 visual alignment.

### `app/sic/layout.tsx`

| Finding | Action |
|--------|--------|
| Hardcoded `#0a0f1c` background | `bg-zinc-950` |
| Cyan default `--sic-primary` | Default `#7c3aed` (violet-600) for Forge alignment |

## `components/sic/SicBarraInstitucional.tsx`

| Finding | Action |
|--------|--------|
| `border-slate-*`, `bg-slate-*`, `text-slate-*` | Map to `zinc` equivalents |

## 1. `/sic` (`app/sic/page.tsx`)

| Legacy | Migrated |
|--------|----------|
| `bg-[#0a0f1c]`, `text-slate-*` | Layout + `text-zinc-*` |
| Cyan primary/secondary links (`bg-cyan-*`, `border-cyan-*`, `text-cyan-*`) | `from-violet-600 to-indigo-600` primary; outline `border-zinc-700` secondary; links `text-violet-400` |
| Module cards `border-slate-700/50`, `hover:border-cyan-500/50` | `border-zinc-800`, `hover:border-violet-500/40` |
| Quick-access footer card | Same card pattern |

**Preserved:** `useTenant`, `MODULOS` data, Spanish copy, all `href`s.

## 2. `/sic/expedientes` (`app/sic/expedientes/page.tsx`)

| Legacy | Migrated |
|--------|----------|
| Page background `#0a0f1c` / slate table | `p-6`, zinc table chrome |
| Cyan CTA and links | Violet–indigo gradient CTA; `text-violet-400` links |
| `ESTADOS_BADGE` `blue-500`, `cyan-500` | `violet` / `indigo` for IA and revisión states |
| `font-mono text-cyan-300` IDs | `text-violet-300` |

**Preserved:** `fetchExpedientes`, tenant gate, error empty states, table structure.

## 3. `/sic/expedientes/[id]` (`app/sic/expedientes/[id]/page.tsx`)

| Legacy | Migrated |
|--------|----------|
| Local `Panel` slate borders | `border-zinc-800`, `bg-zinc-900/50` |
| `text-muted-foreground` | `text-zinc-500` |
| Cyan accents (timeline, links, notas button) | Violet/indigo |
| `style={{ minHeight: "calc(100vh - 200px)" }}` | `min-h-[calc(100vh-12.5rem)]` |
| Slate inputs/buttons | `border-zinc-700`, `bg-zinc-900/80`, zinc button hierarchy |

**Preserved:** All hooks, RBAC (`permisos`), child components (`PanelDecisionOverride`, etc.), `X-Tenant-ID` via API helpers.

## 4. `/sic/bandeja` (`app/sic/bandeja/page.tsx`)

Same class of changes as expedientes list (shared `ESTADOS_BADGE` pattern, table, CTAs).

**Preserved:** `fetchExpedientes`, tenant handling, empty copy.

## 5. `/sic/configuracion` (`app/sic/configuracion/page.tsx`)

| Legacy | Migrated |
|--------|----------|
| `Seccion` slate card | `border-zinc-800`, `bg-zinc-950/50` |
| Inputs `border-slate-600`, `bg-slate-800` | `border-zinc-700`, `bg-zinc-900/80` |
| Headings `text-slate-*` | `text-zinc-*` |
| Role/SSO tables `border-slate-700` | `border-zinc-800` |

**Preserved:** `fetchConfigBanco`, `fetchSICMultiTenantConfig` + `X-Tenant-ID`, `SICRegulatoryBadge`, read-only form fields.

## `components/sic/EstadosSic.tsx`

| Legacy | Migrated |
|--------|----------|
| Spinner `border-cyan-*` | `border-violet-500/50`, `border-t-violet-400` |
| Empty state `border-slate-*`, `bg-slate-*` | `border-zinc-800`, `bg-zinc-950/30` |
| Loading text slate | `text-zinc-*` |

**Note:** `/sic/reportes` and 14 other SIC routes unchanged (Phase 2 / later sprints).
