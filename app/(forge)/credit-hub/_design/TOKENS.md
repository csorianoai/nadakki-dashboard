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
- **Dealer persona (v3.2 semantic overrides):** **Dormant from Phase 1.5** — the `.forge-app [data-portal="dealer"]` block in `_design/tokens.css` is commented out until Phase 4 re-approves dealer dark on v3.2 tokens. **Legacy** dealer dark still comes from `styles/forge-tokens.css` (`--forge-bg`, etc.) via Tailwind fallbacks.
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

<!-- AUTOGEN:TOKENS START -->

## Auto-generated reference (`.forge-app` defaults)

**Generated from `tokens.css` on 2026-05-02.** Do not edit this section by hand. Regenerate with `npm run docs:tokens`.

| CSS variable | Value (source) | Typical Tailwind / usage |
|--------------|----------------|---------------------------|
| `--forge-accent-gold` | #c8940a | `text-forgeAccent-gold` |
| `--forge-accent-teal` | #0a7ea4 | `text-forgeAccent-teal` |
| `--forge-border-subtle` | 1px solid var(--forge-ink-200) | border utilities + `var()` |
| `--forge-border-default` | 1px solid var(--forge-ink-300) | border utilities + `var()` |
| `--forge-border-strong` | 1px solid var(--forge-ink-500) | border utilities + `var()` |
| `--forge-bp-mobile` | 640px | reference only (media queries in CSS) |
| `--forge-bp-tablet` | 1024px | reference only (media queries in CSS) |
| `--forge-bp-desktop` | 1280px | reference only (media queries in CSS) |
| `--forge-bp-wide` | 1536px | reference only (media queries in CSS) |
| `--forge-brand-50` | #f0f4fa | `text-forgeBrand-50`, `bg-forgeBrand-50`, `border-forgeBrand-50` |
| `--forge-brand-100` | #dce6f2 | `text-forgeBrand-100`, `bg-forgeBrand-100`, `border-forgeBrand-100` |
| `--forge-brand-200` | #b6c8e0 | `text-forgeBrand-200`, `bg-forgeBrand-200`, `border-forgeBrand-200` |
| `--forge-brand-300` | #8aa5c9 | `text-forgeBrand-300`, `bg-forgeBrand-300`, `border-forgeBrand-300` |
| `--forge-brand-400` | #5c82b0 | `text-forgeBrand-400`, `bg-forgeBrand-400`, `border-forgeBrand-400` |
| `--forge-brand-500` | #2e5f97 | `text-forgeBrand-500`, `bg-forgeBrand-500`, `border-forgeBrand-500` |
| `--forge-brand-600` | #1e477a | `text-forgeBrand-600`, `bg-forgeBrand-600`, `border-forgeBrand-600` |
| `--forge-brand-700` | #163660 | `text-forgeBrand-700`, `bg-forgeBrand-700`, `border-forgeBrand-700` |
| `--forge-brand-800` | #0f2849 | `text-forgeBrand-800`, `bg-forgeBrand-800`, `border-forgeBrand-800` |
| `--forge-brand-900` | #0a1d36 | `text-forgeBrand-900`, `bg-forgeBrand-900`, `border-forgeBrand-900` |
| `--forge-brand-950` | #050f1f | `text-forgeBrand-950`, `bg-forgeBrand-950`, `border-forgeBrand-950` |
| `--forge-danger-50` | #fef2f2 | `text-forgeDanger-50` (semantic) |
| `--forge-danger-500` | #b5201e | `text-forgeDanger-500` (semantic) |
| `--forge-danger-700` | #8a1816 | `text-forgeDanger-700` (semantic) |
| `--forge-duration-fast` | 120ms | `tailwind.config.js` theme.extend |
| `--forge-duration-base` | 180ms | `tailwind.config.js` theme.extend |
| `--forge-duration-slow` | 240ms | `tailwind.config.js` theme.extend |
| `--forge-ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | `tailwind.config.js` theme.extend |
| `--forge-ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | `tailwind.config.js` theme.extend |
| `--forge-font-display` | var(--forge-font-display-opt), "Source Serif Pro", Georgia, serif | next/font → `font-sans` / `font-display` / `font-forgeMono` |
| `--forge-font-body` | var(--forge-font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | next/font → `font-sans` / `font-display` / `font-forgeMono` |
| `--forge-font-mono` | var(--forge-font-mono-opt), "IBM Plex Mono", ui-monospace, monospace | next/font → `font-sans` / `font-display` / `font-forgeMono` |
| `--forge-info-50` | #eff6ff | `text-forgeInfo-50` (semantic) |
| `--forge-info-500` | #1f60b5 | `text-forgeInfo-500` (semantic) |
| `--forge-info-700` | #154a8c | `text-forgeInfo-700` (semantic) |
| `--forge-ink-50` | #f7f8fa | `text-forgeInk-50`, `border-forgeInk-50` |
| `--forge-ink-100` | #eef1f4 | `text-forgeInk-100`, `border-forgeInk-100` |
| `--forge-ink-200` | #dde3ea | `text-forgeInk-200`, `border-forgeInk-200` |
| `--forge-ink-300` | #c2cbd6 | `text-forgeInk-300`, `border-forgeInk-300` |
| `--forge-ink-400` | #8c97a6 | `text-forgeInk-400`, `border-forgeInk-400` |
| `--forge-ink-500` | #5a6478 | `text-forgeInk-500`, `border-forgeInk-500` |
| `--forge-ink-600` | #3d4759 | `text-forgeInk-600`, `border-forgeInk-600` |
| `--forge-ink-700` | #2a3447 | `text-forgeInk-700`, `border-forgeInk-700` |
| `--forge-ink-800` | #1a2540 | `text-forgeInk-800`, `border-forgeInk-800` |
| `--forge-ink-900` | #0f1729 | `text-forgeInk-900`, `border-forgeInk-900` |
| `--forge-leading-tight` | 1.15 | `tailwind.config.js` theme.extend |
| `--forge-leading-snug` | 1.35 | `tailwind.config.js` theme.extend |
| `--forge-leading-normal` | 1.5 | `tailwind.config.js` theme.extend |
| `--forge-leading-relaxed` | 1.65 | `tailwind.config.js` theme.extend |
| `--forge-neutral-50` | var(--forge-ink-100) | `text-forgeNeutral-50` (semantic) |
| `--forge-neutral-500` | var(--forge-ink-500) | `text-forgeNeutral-500` (semantic) |
| `--forge-neutral-700` | var(--forge-ink-700) | `text-forgeNeutral-700` (semantic) |
| `--forge-radius-none` | 0 | `rounded-forge-none` (see `tailwind.config.js`) |
| `--forge-radius-sm` | 4px | `rounded-forge-sm` (see `tailwind.config.js`) |
| `--forge-radius-md` | 6px | `rounded-forge-md` (see `tailwind.config.js`) |
| `--forge-radius-lg` | 8px | `rounded-forge-lg` (see `tailwind.config.js`) |
| `--forge-radius-pill` | 9999px | `rounded-forge-pill` (see `tailwind.config.js`) |
| `--forge-shadow-none` | none | `shadow-forge-none` if mapped; else raw `var()` |
| `--forge-shadow-xs` | 0 1px 2px 0 rgba(15, 23, 41, 0.04) | `shadow-forge-xs` if mapped; else raw `var()` |
| `--forge-shadow-sm` | 0 1px 3px 0 rgba(15, 23, 41, 0.06), 0 1px 2px 0 rgba(15, 23, 41, 0.04) | `shadow-forge-sm` if mapped; else raw `var()` |
| `--forge-shadow-md` | 0 4px 6px -1px rgba(15, 23, 41, 0.06), 0 2px 4px -1px rgba(15, 23, 41, 0.04) | `shadow-forge-md` if mapped; else raw `var()` |
| `--forge-shadow-lg` | 0 10px 15px -3px rgba(15, 23, 41, 0.08), 0 4px 6px -2px rgba(15, 23, 41, 0.04) | `shadow-forge-lg` if mapped; else raw `var()` |
| `--forge-space-0` | 0 | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-0)]` |
| `--forge-space-1` | 4px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-1)]` |
| `--forge-space-2` | 8px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-2)]` |
| `--forge-space-3` | 12px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-3)]` |
| `--forge-space-4` | 16px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-4)]` |
| `--forge-space-5` | 20px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-5)]` |
| `--forge-space-6` | 24px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-6)]` |
| `--forge-space-8` | 32px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-8)]` |
| `--forge-space-10` | 40px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-10)]` |
| `--forge-space-12` | 48px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-12)]` |
| `--forge-space-16` | 64px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-16)]` |
| `--forge-space-20` | 80px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-20)]` |
| `--forge-space-24` | 96px | spacing scale → Tailwind `forge` spacing plugin or arbitrary `p-[length:var(--forge-space-24)]` |
| `--forge-success-50` | #ecfdf5 | `text-forgeSuccess-50` (semantic) |
| `--forge-success-500` | #0f7a3e | `text-forgeSuccess-500` (semantic) |
| `--forge-success-700` | #0a5a2e | `text-forgeSuccess-700` (semantic) |
| `--forge-surface-page` | #f7f8fa | `bg-forgeSurface-page` |
| `--forge-surface-card` | #ffffff | `bg-forgeSurface-card` |
| `--forge-surface-raised` | #ffffff | `bg-forgeSurface-raised` |
| `--forge-surface-sunken` | #f0f2f5 | `bg-forgeSurface-sunken` |
| `--forge-surface-overlay` | rgba(15, 23, 41, 0.48) | `bg-forgeSurface-overlay` |
| `--forge-text-xs` | 11px | font-size: `text-[length:var(--forge-text-xs)]` pattern |
| `--forge-text-sm` | 13px | font-size: `text-[length:var(--forge-text-sm)]` pattern |
| `--forge-text-base` | 14px | font-size: `text-[length:var(--forge-text-base)]` pattern |
| `--forge-text-md` | 16px | font-size: `text-[length:var(--forge-text-md)]` pattern |
| `--forge-text-lg` | 18px | font-size: `text-[length:var(--forge-text-lg)]` pattern |
| `--forge-text-xl` | 22px | font-size: `text-[length:var(--forge-text-xl)]` pattern |
| `--forge-text-2xl` | 28px | font-size: `text-[length:var(--forge-text-2xl)]` pattern |
| `--forge-text-3xl` | 36px | font-size: `text-[length:var(--forge-text-3xl)]` pattern |
| `--forge-text-4xl` | 48px | font-size: `text-[length:var(--forge-text-4xl)]` pattern |
| `--forge-tracking-tight` | -0.02em | `tailwind.config.js` theme.extend |
| `--forge-tracking-normal` | 0 | `tailwind.config.js` theme.extend |
| `--forge-tracking-wide` | 0.04em | `tailwind.config.js` theme.extend |
| `--forge-tracking-wider` | 0.08em | `tailwind.config.js` theme.extend |
| `--forge-viz-1` | #2e5f97 | `fill-forgeViz-1` / chart tokens |
| `--forge-viz-2` | #0a7ea4 | `fill-forgeViz-2` / chart tokens |
| `--forge-viz-3` | #0f7a3e | `fill-forgeViz-3` / chart tokens |
| `--forge-viz-4` | #c8940a | `fill-forgeViz-4` / chart tokens |
| `--forge-viz-5` | #8a4fbf | `fill-forgeViz-5` / chart tokens |
| `--forge-viz-6` | #b5201e | `fill-forgeViz-6` / chart tokens |
| `--forge-warning-50` | #fffbeb | `text-forgeWarning-50` (semantic) |
| `--forge-warning-500` | #b7791f | `text-forgeWarning-500` (semantic) |
| `--forge-warning-700` | #8c5a14 | `text-forgeWarning-700` (semantic) |
| `--forge-weight-regular` | 400 | `tailwind.config.js` theme.extend |
| `--forge-weight-medium` | 500 | `tailwind.config.js` theme.extend |
| `--forge-weight-semibold` | 600 | `tailwind.config.js` theme.extend |
| `--forge-weight-bold` | 700 | `tailwind.config.js` theme.extend |

### When NOT to use these rows alone

Tenant overrides (e.g. `[data-tenant="credicefi"]`) and dormant dealer blocks **redefine** some of the same names — read the source `tokens.css` for override sections. Legacy dual-var colors live in `tailwind.config.js` + `styles/forge-tokens.css` per Phase 7.2 Case B.


<!-- AUTOGEN:TOKENS END -->
