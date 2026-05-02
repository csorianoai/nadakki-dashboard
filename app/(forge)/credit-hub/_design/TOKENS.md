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

## Auto-generated token reference

**Generated from `tokens.css` on 2026-05-02.** Do not edit this block by hand. Regenerate: `npm run docs:tokens`.

### Tailwind bridge (excerpt)

`forgeBrand: {
          50: 'var(--forge-brand-50)',
          100: 'var(--forge-brand-100)',
          200: 'var(--forge-brand-200)',
          300: 'var(--forge-brand-300)',
          400: 'var(--forge-brand-400)',
          500: 'var(--forge-brand-500)',
          600: 'var(--forge-brand-600)',
          700: 'var(--forge-brand-700)',
          800: 'var(--forge-brand-800)',
         …`

### BEFORE / AFTER (migration)

| BEFORE (legacy) | AFTER (v3.2) |
|-----------------|-------------|
| `bg-forge-bg` on new bank surfaces | `bg-forgeSurface-page` / `bg-forgeSurface-card` |
| Arbitrary hex in JSX | `text-forgeBrand-600` / chart `fill-forgeViz-*` |
| `rounded-2xl` on cards | `rounded-forge-lg` (max 8px policy) |

### ACCENT

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#c8940a"/></svg> | `--forge-accent-gold` | #c8940a | `text-forgeAccent-gold` | Semantic usage for **ACCENT** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0a7ea4"/></svg> | `--forge-accent-teal` | #0a7ea4 | `text-forgeAccent-teal` | Semantic usage for **ACCENT** group. | Outside `.forge-app` without legacy fallbacks. |

### BRAND

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#dce6f2"/></svg> | `--forge-brand-100` | #dce6f2 | `text-forgeBrand-100` / `bg-forgeBrand-100` / `border-forgeBrand-100` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#b6c8e0"/></svg> | `--forge-brand-200` | #b6c8e0 | `text-forgeBrand-200` / `bg-forgeBrand-200` / `border-forgeBrand-200` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#8aa5c9"/></svg> | `--forge-brand-300` | #8aa5c9 | `text-forgeBrand-300` / `bg-forgeBrand-300` / `border-forgeBrand-300` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#5c82b0"/></svg> | `--forge-brand-400` | #5c82b0 | `text-forgeBrand-400` / `bg-forgeBrand-400` / `border-forgeBrand-400` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#f0f4fa"/></svg> | `--forge-brand-50` | #f0f4fa | `text-forgeBrand-50` / `bg-forgeBrand-50` / `border-forgeBrand-50` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#2e5f97"/></svg> | `--forge-brand-500` | #2e5f97 | `text-forgeBrand-500` / `bg-forgeBrand-500` / `border-forgeBrand-500` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#1e477a"/></svg> | `--forge-brand-600` | #1e477a | `text-forgeBrand-600` / `bg-forgeBrand-600` / `border-forgeBrand-600` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#163660"/></svg> | `--forge-brand-700` | #163660 | `text-forgeBrand-700` / `bg-forgeBrand-700` / `border-forgeBrand-700` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0f2849"/></svg> | `--forge-brand-800` | #0f2849 | `text-forgeBrand-800` / `bg-forgeBrand-800` / `border-forgeBrand-800` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0a1d36"/></svg> | `--forge-brand-900` | #0a1d36 | `text-forgeBrand-900` / `bg-forgeBrand-900` / `border-forgeBrand-900` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#050f1f"/></svg> | `--forge-brand-950` | #050f1f | `text-forgeBrand-950` / `bg-forgeBrand-950` / `border-forgeBrand-950` | Semantic usage for **BRAND** group. | Outside `.forge-app` without legacy fallbacks. |

### DATA VIZ

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| — | `--forge-border-default` | 1px solid var(--forge-ink-300) | border + `var()` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-border-strong` | 1px solid var(--forge-ink-500) | border + `var()` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-border-subtle` | 1px solid var(--forge-ink-200) | border + `var()` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-bp-desktop` | 1280px | reference breakpoints (CSS only) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-bp-mobile` | 640px | reference breakpoints (CSS only) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-bp-tablet` | 1024px | reference breakpoints (CSS only) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-bp-wide` | 1536px | reference breakpoints (CSS only) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-duration-base` | 180ms | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-duration-fast` | 120ms | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-duration-slow` | 240ms | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-font-body` | var(--forge-font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif | `font-sans` / `font-display` / `font-forgeMono` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-font-display` | var(--forge-font-display-opt), "Source Serif Pro", Georgia, serif | `font-sans` / `font-display` / `font-forgeMono` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-font-mono` | var(--forge-font-mono-opt), "IBM Plex Mono", ui-monospace, monospace | `font-sans` / `font-display` / `font-forgeMono` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-leading-normal` | 1.5 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-leading-relaxed` | 1.65 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-leading-snug` | 1.35 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-leading-tight` | 1.15 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-radius-lg` | 8px | `rounded-forge-lg` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-radius-md` | 6px | `rounded-forge-md` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-radius-none` | 0 | `rounded-forge-none` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-radius-pill` | 9999px | `rounded-forge-pill` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-radius-sm` | 4px | `rounded-forge-sm` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-shadow-lg` | 0 10px 15px -3px rgba(15, 23, 41, 0.08), 0 4px 6px -2px rgba(15, 23, 41, 0.04) | `shadow-forge-lg` (if mapped) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-shadow-md` | 0 4px 6px -1px rgba(15, 23, 41, 0.06), 0 2px 4px -1px rgba(15, 23, 41, 0.04) | `shadow-forge-md` (if mapped) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-shadow-none` | none | `shadow-forge-none` (if mapped) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-shadow-sm` | 0 1px 3px 0 rgba(15, 23, 41, 0.06), 0 1px 2px 0 rgba(15, 23, 41, 0.04) | `shadow-forge-sm` (if mapped) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-shadow-xs` | 0 1px 2px 0 rgba(15, 23, 41, 0.04) | `shadow-forge-xs` (if mapped) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-0` | 0 | `p-[length:var(--forge-space-0)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-1` | 4px | `p-[length:var(--forge-space-1)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-10` | 40px | `p-[length:var(--forge-space-10)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-12` | 48px | `p-[length:var(--forge-space-12)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-16` | 64px | `p-[length:var(--forge-space-16)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-2` | 8px | `p-[length:var(--forge-space-2)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-20` | 80px | `p-[length:var(--forge-space-20)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-24` | 96px | `p-[length:var(--forge-space-24)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-3` | 12px | `p-[length:var(--forge-space-3)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-4` | 16px | `p-[length:var(--forge-space-4)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-5` | 20px | `p-[length:var(--forge-space-5)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-6` | 24px | `p-[length:var(--forge-space-6)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-space-8` | 32px | `p-[length:var(--forge-space-8)]` (arbitrary) | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-2xl` | 28px | `text-[length:var(--forge-text-2xl)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-3xl` | 36px | `text-[length:var(--forge-text-3xl)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-4xl` | 48px | `text-[length:var(--forge-text-4xl)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-base` | 14px | `text-[length:var(--forge-text-base)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-lg` | 18px | `text-[length:var(--forge-text-lg)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-md` | 16px | `text-[length:var(--forge-text-md)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-sm` | 13px | `text-[length:var(--forge-text-sm)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-xl` | 22px | `text-[length:var(--forge-text-xl)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-text-xs` | 11px | `text-[length:var(--forge-text-xs)]` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-tracking-normal` | 0 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-tracking-tight` | -0.02em | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-tracking-wide` | 0.04em | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-tracking-wider` | 0.08em | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#2e5f97"/></svg> | `--forge-viz-1` | #2e5f97 | `fill-forgeViz-1` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0a7ea4"/></svg> | `--forge-viz-2` | #0a7ea4 | `fill-forgeViz-2` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0f7a3e"/></svg> | `--forge-viz-3` | #0f7a3e | `fill-forgeViz-3` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#c8940a"/></svg> | `--forge-viz-4` | #c8940a | `fill-forgeViz-4` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#8a4fbf"/></svg> | `--forge-viz-5` | #8a4fbf | `fill-forgeViz-5` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#b5201e"/></svg> | `--forge-viz-6` | #b5201e | `fill-forgeViz-6` | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-weight-bold` | 700 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-weight-medium` | 500 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-weight-regular` | 400 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-weight-semibold` | 600 | composition / motion tokens | Semantic usage for **DATA VIZ** group. | Outside `.forge-app` without legacy fallbacks. |

### INK

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#eef1f4"/></svg> | `--forge-ink-100` | #eef1f4 | `text-forgeInk-100` / `border-forgeInk-100` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#dde3ea"/></svg> | `--forge-ink-200` | #dde3ea | `text-forgeInk-200` / `border-forgeInk-200` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#c2cbd6"/></svg> | `--forge-ink-300` | #c2cbd6 | `text-forgeInk-300` / `border-forgeInk-300` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#8c97a6"/></svg> | `--forge-ink-400` | #8c97a6 | `text-forgeInk-400` / `border-forgeInk-400` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#f7f8fa"/></svg> | `--forge-ink-50` | #f7f8fa | `text-forgeInk-50` / `border-forgeInk-50` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#5a6478"/></svg> | `--forge-ink-500` | #5a6478 | `text-forgeInk-500` / `border-forgeInk-500` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#3d4759"/></svg> | `--forge-ink-600` | #3d4759 | `text-forgeInk-600` / `border-forgeInk-600` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#2a3447"/></svg> | `--forge-ink-700` | #2a3447 | `text-forgeInk-700` / `border-forgeInk-700` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#1a2540"/></svg> | `--forge-ink-800` | #1a2540 | `text-forgeInk-800` / `border-forgeInk-800` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0f1729"/></svg> | `--forge-ink-900` | #0f1729 | `text-forgeInk-900` / `border-forgeInk-900` | Semantic usage for **INK** group. | Outside `.forge-app` without legacy fallbacks. |

### SEMANTIC

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#fef2f2"/></svg> | `--forge-danger-50` | #fef2f2 | `text-forgeDanger-50` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#b5201e"/></svg> | `--forge-danger-500` | #b5201e | `text-forgeDanger-500` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#8a1816"/></svg> | `--forge-danger-700` | #8a1816 | `text-forgeDanger-700` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#eff6ff"/></svg> | `--forge-info-50` | #eff6ff | `text-forgeInfo-50` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#1f60b5"/></svg> | `--forge-info-500` | #1f60b5 | `text-forgeInfo-500` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#154a8c"/></svg> | `--forge-info-700` | #154a8c | `text-forgeInfo-700` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-neutral-50` | var(--forge-ink-100) | `text-forgeNeutral-50` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-neutral-500` | var(--forge-ink-500) | `text-forgeNeutral-500` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-neutral-700` | var(--forge-ink-700) | `text-forgeNeutral-700` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#ecfdf5"/></svg> | `--forge-success-50` | #ecfdf5 | `text-forgeSuccess-50` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0f7a3e"/></svg> | `--forge-success-500` | #0f7a3e | `text-forgeSuccess-500` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#0a5a2e"/></svg> | `--forge-success-700` | #0a5a2e | `text-forgeSuccess-700` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#fffbeb"/></svg> | `--forge-warning-50` | #fffbeb | `text-forgeWarning-50` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#b7791f"/></svg> | `--forge-warning-500` | #b7791f | `text-forgeWarning-500` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#8c5a14"/></svg> | `--forge-warning-700` | #8c5a14 | `text-forgeWarning-700` | Semantic usage for **SEMANTIC** group. | Outside `.forge-app` without legacy fallbacks. |

### SURFACE

| Swatch | Variable | Value | Tailwind (typical) | When to use | When NOT |
|--------|----------|-------|--------------------|-------------|----------|
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#ffffff"/></svg> | `--forge-surface-card` | #ffffff | `bg-forgeSurface-card` | Semantic usage for **SURFACE** group. | Outside `.forge-app` without legacy fallbacks. |
| — | `--forge-surface-overlay` | rgba(15, 23, 41, 0.48) | `bg-forgeSurface-overlay` | Semantic usage for **SURFACE** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#f7f8fa"/></svg> | `--forge-surface-page` | #f7f8fa | `bg-forgeSurface-page` | Semantic usage for **SURFACE** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#ffffff"/></svg> | `--forge-surface-raised` | #ffffff | `bg-forgeSurface-raised` | Semantic usage for **SURFACE** group. | Outside `.forge-app` without legacy fallbacks. |
| <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" aria-hidden="true"><rect width="24" height="14" rx="2" fill="#f0f2f5"/></svg> | `--forge-surface-sunken` | #f0f2f5 | `bg-forgeSurface-sunken` | Semantic usage for **SURFACE** group. | Outside `.forge-app` without legacy fallbacks. |

### Notes

- Tenant overrides and dormant dealer blocks live **outside** this autogen slice — see source `tokens.css`.
- Phase 7.2 Case B: legacy `styles/forge-tokens.css` + Tailwind PERMANENT ALIASES remain until `components/credit-hub/**` migrates.


<!-- AUTOGEN:TOKENS END -->
