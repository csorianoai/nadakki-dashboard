# Forge Credit Hub — components

## Barrel

App code imports from `@/components/forge` (see `components/forge/index.ts`).

## Phase 2 primitives (28 exports)

Presentational building blocks under `components/forge/ui/*` (and generic `layout/Sidebar`, `layout/Topbar` for previews):

Button, IconButton, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Card, EmptyState, Badge, StatusPill, Skeleton, Avatar, Modal, Drawer, Toast (`ForgeToaster` + `toast`), Tabs, Breadcrumb, DataTable, KpiCard, EvidenceCard, AuditTimeline, CommandPalette, MoneyInput, DateInput, ConsentCapture.

These primitives are **persona-agnostic** (no `usePersona` / no layout segments).

## Preview playground

**Canonical URL:** `/credit-hub/preview`

Static route: `app/(forge)/credit-hub/preview/page.tsx`.  
Next.js treats leading-underscore segments as **private folders**, so the playground is **not** under `_design/preview` in the filesystem; use the URL above in docs and links.

## App shell (Phase 3)

- **`ForgeCreditHubAppShell`** (`components/forge/layout/ForgeCreditHubAppShell.tsx`) wraps Credit Hub in `app/(forge)/credit-hub/layout.tsx`: sidebar, top bar, tenant guard, `data-portal` + **`data-tenant`** (from `useTenant` in `lib/credit-hub/hooks/useTenant.ts`).
- **`ForgeCreditHubSidebar`** / **`ForgeCreditHubTopbar`** consume **`usePersona()`** and **`TenantContext`** / i18n for labels — they **do not** import `useSelectedLayoutSegments`.

### Persona contract (Phase 8 refactor scope)

**Rule:** Every Forge file under `components/forge/ui/*` and every persona-aware layout module under `components/forge/layout/*` except the shell seam must consume **`usePersona()`** — **not** `useSelectedLayoutSegments()` directly.

**Single seam today:** `creditHubPersonaFromLayoutSegments.ts` is the **only** module that reads layout segments; it is called from **`ForgeCreditHubAppShell`** solely to **seed** `PersonaProvider`. Replacing that seam in Phase 8 is a **small, localized** change (swap segment resolver for tenant-driven persona feeding the same `PersonaProvider`).

### DEFERRED TO PHASE 8 — URL-derived persona (accepted debt)

**Current implementation:** Persona (`bank` | `dealer`) fed to `PersonaProvider` is derived from **`useSelectedLayoutSegments()`** via **`creditHubPersonaFromLayoutSegments()`**, keyed off the first route segment under `/credit-hub` (`bank` / `dealer`). This **does not** meet the stricter “no URL-derived persona” guardrail from the Phase 3 brief.

**Target implementation:** Derive persona from **`TenantContext`** (and/or auth-derived role metadata) once Path A/B decisions allow extending tenant metadata **without** breaking other cores — see `TENANT_CONTEXT_EXTENSION.md` (ForgeBrandingProvider / Path B).

**Why deferred:** Correct fix requires coordinated **`TenantContext`** / Forge provider work — **explicitly Phase 8** territory; **`TenantContext.tsx` and `lib/credit-hub/hooks/useTenant.ts` remain unchanged** in Phases 2–4 per guardrails.

**Refactor scope:** Downstream components already use **`usePersona()`**; Phase 8 replaces **only** how `PersonaProvider` gets its `persona` prop (today: `ForgeCreditHubAppShell` + segment helper).

**Acceptance (Phase 8):** Phase 8 acceptance criteria will include **removing segment-based persona** in favor of tenant-driven (or role-driven) resolution, with regression checks on bank/dealer nav and `data-portal` styling.

**Interim risk acceptance:** URL ↔ persona alignment matches current folder layout (`bank/*`, `dealer/*`); no security boundary relies on persona today (server enforces `tenant_id` + JWT role).
