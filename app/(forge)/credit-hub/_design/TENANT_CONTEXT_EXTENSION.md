# Tenant context extension — Forge (Path B)

**Status:** Phase 1 documents the decision only. **Implementation is Phase 8.**

## Decision (locked)

**Path B — `ForgeBrandingProvider`** (per master prompt v3.2 Part 8.2 and Cesar approval, 2026-04-29).

- `contexts/TenantContext.tsx` remains the **single source of truth** for tenant identity and existing `TenantSettings` consumed by Legal, Marketing, SIC, and Credit Hub.
- **No breaking API changes** to `TenantContext` for other cores.
- A **Forge-only** provider will be composed **inside** the existing tenant tree (under routes wrapped by `TenantProvider` / auth), consume `useTenant()` from `@/contexts/TenantContext`, fetch or derive **Forge branding** (`logo_url`, `brand_primary`, `locale`, `currency`, `regulatory_profile`, `copy_overrides`), and:
  - Apply `data-tenant` on the Forge root (same node as `.forge-app` when practical) for CSS overrides in `_design/tokens.css`.
  - Map API branding to CSS custom properties (e.g. `color-mix` for brand ramp) without `if (tenantId === '…')` in UI.

## Deferred to Phase 8

### `DEFAULT_CREDIT_TENANT_ID` (`lib/credit-hub/types/creditCore.ts`)

- **`0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`** is the **canonical Credicefi** fallback for Credit Core today (documented in JSDoc on the constant; verified in Phase 1.5 investigation — see `BLOCKER_phase1.5.md` resolution).
- **Path B** may **eliminate** this constant if default tenant resolution moves entirely to auth + env + `ForgeBrandingProvider` with no last-resort UUID.
- **`lib/credit-hub/hooks/useTenant.ts`** remains unchanged until Phase 8 by design.

## Files (planned Phase 8 — not executed in Phase 1)

- New: `components/forge/layout/ForgeBrandingProvider.tsx` (or equivalent path per repo convention).
- Wire: `app/(forge)/layout.tsx` or `app/(forge)/credit-hub/layout.tsx` — to be chosen when implementing (must not break non-Forge routes).
- Update this document with the final file list and props when implemented.

## Deferred decisions

### Persona resolution (`bank` | `dealer`) — URL segments today (Phase 3 debt)

- **Status:** **Accepted interim** (2026-05-01, Cesar). Documented in `_design/COMPONENTS.md` under **DEFERRED TO PHASE 8**.
- **Current:** `ForgeCreditHubAppShell` seeds `PersonaProvider` using **`creditHubPersonaFromLayoutSegments(useSelectedLayoutSegments())`**. All other Forge layout/UI consumers use **`usePersona()`** only.
- **Target:** Feed persona from **`TenantContext`** (and/or auth metadata) once Path B / `ForgeBrandingProvider` work lands — **no** `useSelectedLayoutSegments` in persona resolution.
- **Why deferred:** Extending `TenantContext` for persona is **Phase 8**; Phases 2–4 must not modify `TenantContext.tsx` or `useTenant.ts` per guardrails.
- **Phase 8 acceptance:** Remove segment-based persona; single-file seam today (`creditHubPersonaFromSegments.ts` + shell call site) is the refactor boundary.

### Dealer dark mode (v3.2 semantic overrides)

- **Status:** **Dormant** as of Phase 1.5 (2026-05-01, Cesar).
- **Implementation:** The `.forge-app [data-portal="dealer"]` block in `tokens.css` is wrapped in a CSS comment block so v3.2 ink/surface tokens stay **light-institutional defaults** everywhere until Phase 4 explicitly re-approves dealer dark.
- **Phase 2:** New `components/forge/*` primitives must **not** rely on dealer-only dark v3.2 tokens; use legacy portal variables via Tailwind fallbacks where needed, or flat surfaces per v3.2 light spec until Phase 4.
