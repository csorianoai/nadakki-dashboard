# Forge design tokens (v3.2 Phase 1)

This document describes the **institutional token layer** introduced in Phase 1, how it coexists with legacy portal CSS, and the **dual-theme** strategy locked by product (Cesar, 2026-04-29).

## Where tokens live

| File | Role |
|------|------|
| `app/(forge)/credit-hub/_design/tokens.css` | **v3.2 semantic system** — brand/ink/surface/semantic type/motion/radii/shadows scoped to `.forge-app`. |
| `styles/forge-tokens.css` | **Legacy portal palette** — `--forge-primary`, `--forge-bg`, `[data-portal="dealer"|"bank"]`, spacing/radius/shadows used by current `ForgeCard`, `PortalShell`, etc. **Do not delete** until Phases 4–7 migrate components. |
| `app/(forge)/credit-hub/forge-globals.css` | Imports **legacy first**, then **v3.2** (`@import` order). Also defines `.forge-route`. |

## Import convention (Phase 1)

1. `app/(forge)/credit-hub/layout.tsx` imports `./forge-globals.css` (client layout — ensures all Credit Hub routes load both layers).
2. `app/(forge)/layout.tsx` loads **fonts only** (`next/font`) and wraps children in `.forge-app` with CSS variables from Inter, JetBrains Mono, and Source Serif 4.

Space Grotesk is **deprecated for Forge**; it is not imported in the Forge layout. It was never listed in `package.json` (it comes from `next/font/google`); other cores are unchanged.

## Dual theme (architectural decision)

- **Bank persona (default under `.forge-app`):** **Light institutional** surfaces and ink scale per master prompt Part 4 (Goldman-style direction). New variables: `--forge-surface-page`, `--forge-ink-*`, `--forge-brand-*`, etc.
- **Dealer persona:** **Dark operational** experience preserved for showroom/mobile. Scoped with `.forge-app [data-portal="dealer"]` in `tokens.css`, aligned with legacy dealer hexes (`#0A0E1A`, `#131829`, …) for the **new** semantic names only.
- **Legacy `styles/forge-tokens.css`:** Still supplies `--forge-bg`, `--forge-text`, gradients, and portal-specific colors for **existing components** until refactors remove them.

New light defaults do **not** automatically switch old `bg-forge-bg` / `text-forge-text` utilities to light mode; that is a later presentation migration.

## Tenant overrides

Examples in `tokens.css`:

- `.forge-app[data-tenant="credicefi"]`
- `.forge-app[data-tenant="banco-piloto"]`

**Phase 8** will implement **Path B — `ForgeBrandingProvider`** (see `TENANT_CONTEXT_EXTENSION.md`) to set `data-tenant` and dynamic brand CSS from `tenant_branding`, without extending `TenantContext.tsx` API.

## Tailwind (Phase 1)

`tailwind.config.js` **keeps** all existing `forge-primary`, `forge-bg`, `forge-text`, … utilities.

**Added** nested color groups bound to v3.2 variables (examples):

- `text-forgeInk-800`, `bg-forgeSurface-page`, `text-forgeBrand-500`, `border-forgeSuccess-500`, `text-forgeAccent-gold`, `fill-forgeViz-3`, …

`fontFamily` uses nested `var()` fallbacks so `font-display` / `font-sans` / `forgeMono` still resolve on routes **outside** `.forge-app` (e.g. legacy `app/credit/*`).

## Typography variables

| Variable | Meaning |
|----------|---------|
| `--forge-font-sans` | Inter (next/font) on `.forge-app` |
| `--forge-font-display-opt` | Source Serif 4 (next/font) on `.forge-app` |
| `--forge-font-mono-opt` | JetBrains Mono (next/font) on `.forge-app` |
| `--forge-font-body` | Full body stack (defined in `tokens.css` on `.forge-app`) |
| `--forge-font-display` | Display stack: Source Serif + fallbacks |
| `--forge-font-mono` | Mono stack |

## Motion

`tokens.css` includes `@media (prefers-reduced-motion: reduce)` scoped to `.forge-app` (short transitions). `styles/forge-tokens.css` already has a global reduced-motion block; both can apply inside Forge without conflict.

## Migration plan (Phases 4–7, summary)

1. Replace ad hoc hex in components with `forgeBrand` / `forgeInk` / `forgeSurface` / semantic utilities.
2. Gradually map legacy `bg-forge-bg` bank shell to light institutional surfaces once layouts adopt v3.2.
3. Remove or narrow `styles/forge-tokens.css` only when no consumer references its variables.
4. Align radii/shadows in components with v3.2 `--forge-radius-*` and `--forge-shadow-*` (today many components use Tailwind `rounded-2xl` etc.).

## `DEFAULT_CREDIT_TENANT_ID` deprecation

`lib/credit-hub/types/creditCore.ts` exports a **deprecated** hardcoded tenant UUID used as a last-resort fallback in `lib/credit-hub/hooks/useTenant.ts`. **Do not add new consumers.** Elimination is scheduled for **Phase 8** together with `ForgeBrandingProvider` and tenant resolution. See JSDoc on the constant and `TENANT_CONTEXT_EXTENSION.md`.

## Token reference (names)

All custom properties below are defined under **`.forge-app`** in `tokens.css` unless noted.

- **Brand:** `--forge-brand-50` … `--forge-brand-950`
- **Ink:** `--forge-ink-50` … `--forge-ink-900`
- **Surface:** `--forge-surface-page`, `--forge-surface-card`, `--forge-surface-raised`, `--forge-surface-sunken`, `--forge-surface-overlay`
- **Semantic:** `--forge-success-*`, `--forge-warning-*`, `--forge-danger-*`, `--forge-info-*`, `--forge-neutral-*`
- **Accent:** `--forge-accent-gold`, `--forge-accent-teal`
- **Viz:** `--forge-viz-1` … `--forge-viz-6`
- **Type scale:** `--forge-text-xs` … `--forge-text-4xl`, weights, leading, tracking
- **Space:** `--forge-space-0` … `--forge-space-24`
- **Radius:** `--forge-radius-none`, `sm`, `md`, `lg`, `pill`
- **Shadow:** `--forge-shadow-none`, `xs`, `sm`, `md`, `lg`
- **Border:** `--forge-border-subtle`, `--forge-border-default`, `--forge-border-strong`
- **Motion:** `--forge-ease-out`, `--forge-ease-in-out`, `--forge-duration-fast|base|slow`
- **Breakpoints (reference):** `--forge-bp-mobile` … `--forge-bp-wide`

Dealer overrides repeat the same **names** with dark-appropriate values under `.forge-app [data-portal="dealer"]`.
