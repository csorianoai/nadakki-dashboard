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

## Deferred decisions

### Dealer dark mode (v3.2 semantic overrides)

- **Status:** **Dormant** as of Phase 1.5 (2026-05-01, Cesar).
- **Implementation:** The `.forge-app [data-portal="dealer"]` block in `_design/tokens.css` is wrapped in a CSS comment block so v3.2 ink/surface tokens stay **light-institutional defaults** everywhere until Phase 4 explicitly re-approves dealer dark.
- **Phase 2:** New `components/forge/*` primitives must **not** rely on dealer-only dark v3.2 tokens; use legacy portal variables via Tailwind fallbacks where needed, or flat surfaces per v3.2 light spec until Phase 4.

### `DEFAULT_CREDIT_TENANT_ID` → Banco Piloto RD

- **Status:** **Investigation complete** — see **`BLOCKER_phase1.5.md`** for cross-repo evidence.
- **Findings:** `0a91ee98-2dbe-46d0-a43c-3fc2dbd42242` matches **Credicefi** in `nadakki-ai-suite/validation_output.txt` (`default_tenant` JSON). Banco Piloto RD for Credit is **`550e8400-e29b-41d4-a716-446655440099`** (`docs/credit/SECOND_TENANT_PILOT.md` + `config/credit/tenants/*.json`). The RFC nil UUID `…440000` is not used.
- **Action:** Cesar chooses option **A / B / C** in the blocker doc before any constant change.
