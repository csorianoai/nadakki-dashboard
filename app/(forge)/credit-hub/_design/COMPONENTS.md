# Forge Credit Hub — components

## Barrel

App code imports from `@/components/forge` (see `components/forge/index.ts`).

## Preview playground

**Canonical URL:** `/credit-hub/preview`

Static route: `app/(forge)/credit-hub/preview/page.tsx`.  
Next.js treats leading-underscore segments as **private folders**, so the playground is **not** under `_design/preview` in the filesystem; use the URL above in docs and links.

## App shell (Phase 3)

- **`ForgeCreditHubAppShell`** (`components/forge/layout/ForgeCreditHubAppShell.tsx`) wraps Credit Hub in `app/(forge)/credit-hub/layout.tsx`: sidebar, top bar, tenant guard, `data-portal` + **`data-tenant`** (from `useTenant` in `lib/credit-hub/hooks/useTenant.ts`).
- **Persona (`bank` | `dealer`)** is supplied to **`PersonaProvider`** from **layout segments** under `/credit-hub` (`bank` / `dealer` route folders). **`ForgeCreditHubSidebar`** / **`ForgeCreditHubTopbar`** consume **`usePersona()`** and dashboard **`TenantContext`** for labels — not raw URL strings. Phase 8 may replace segment-based resolution with tenant metadata.
