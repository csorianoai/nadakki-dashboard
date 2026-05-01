# Tenant context extension — Forge (Path B)

**Status:** Phase 1 documents the decision only. **Implementation is Phase 8.**

## Decision (locked)

**Path B — `ForgeBrandingProvider`** (per master prompt v3.2 Part 8.2 and Cesar approval, 2026-04-29).

- `contexts/TenantContext.tsx` remains the **single source of truth** for tenant identity and existing `TenantSettings` consumed by Legal, Marketing, SIC, and Credit Hub.
- **No breaking API changes** to `TenantContext` for other cores.
- A **Forge-only** provider will be composed **inside** the existing tenant tree (under routes wrapped by `TenantProvider` / auth), consume `useTenant()` from `@/contexts/TenantContext`, fetch or derive **Forge branding** (`logo_url`, `brand_primary`, `locale`, `currency`, `regulatory_profile`, `copy_overrides`), and:
  - Apply `data-tenant` on the Forge root (same node as `.forge-app` when practical) for CSS overrides in `_design/tokens.css`.
  - Map API branding to CSS custom properties (e.g. `color-mix` for brand ramp) without `if (tenantId === '…')` in UI.

## `DEFAULT_CREDIT_TENANT_ID` elimination (Phase 8)

`lib/credit-hub/types/creditCore.ts` exports `DEFAULT_CREDIT_TENANT_ID` with a **@deprecated** JSDoc as of Phase 1.

- **Phase 1:** No behavioral change; **do not modify** `lib/credit-hub/hooks/useTenant.ts`.
- **Phase 8:** Remove the fallback once every Forge session resolves tenant from auth + branding provider (or explicit env) with no hardcoded UUID.

## Files (planned Phase 8 — not executed in Phase 1)

- New: `components/forge/layout/ForgeBrandingProvider.tsx` (or equivalent path per repo convention).
- Wire: `app/(forge)/layout.tsx` or `app/(forge)/credit-hub/layout.tsx` — to be chosen when implementing (must not break non-Forge routes).
- Update this document with the final file list and props when implemented.
