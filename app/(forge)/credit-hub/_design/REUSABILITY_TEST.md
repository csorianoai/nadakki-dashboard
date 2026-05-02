# Forge Credit Hub — Reusability test (Phase 6)

## Objective

Validate that a **new financial institution** can be exercised through **configuration only** (tenant banking config + CSS tokens), without forking Forge pages or primitives.

## Mechanism (Option A)

1. **Fixture:** `app/(forge)/credit-hub/_design/_inventory/test-tenant-fixtures.ts` exports `TESTBANK_MEXICO_FIXTURE` (`TenantBankingConfig`) and `FORGE_TEST_MX_TENANT_ID`.
2. **Build flag:** `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` (local / CI only; never production).
3. **Runtime wiring:**
   - `lib/credit-hub/forge-test-tenant-override.ts` — detects the flag and exposes the fixture + `.forge-app` `[data-tenant]` slug.
   - `lib/credit-hub/hooks/useTenant.ts` — forces Credit Hub `tenantId` / slug to the MX test UUID when the flag is set.
   - `lib/credit-hub/hooks/useTenantConfig.ts` — returns the fixture instead of DO defaults when the flag is set.
   - `app/(forge)/layout.tsx` — sets `data-tenant` on `.forge-app` so `_design/tokens.css` tenant ramps apply (same contract as Phase 8 branding provider).
4. **Theme:** `app/(forge)/credit-hub/_design/tokens.css` — `.forge-app[data-tenant="test-mx-tenant-uuid"]` defines deep-red `--forge-brand-*` and sidebar header treatment.
5. **Regulatory / copy:** `lib/credit-hub/compliance/regulatory-surface.ts` maps `regulatory_profile` to compliance hero + retention strings (CNBV vs DO) without backend changes.
6. **Locale:** `es-MX` bundle `lib/credit-hub/i18n/locales/es-MX/credit-hub.ts` + `useTranslations` registration; `CreditHubI18nBootstrap` sets `document.documentElement.lang` from `tenantConfig.locale`.

## How to run

```powershell
$env:NEXT_PUBLIC_FORGE_TEST_TENANT="mx"
npm run build
npm run start
# optional: capture screenshots
node tools/capture-forge-reusability.mjs
```

Artifacts: `app/(forge)/credit-hub/_design/_inventory/reusability-test/` (see `desktop/` and `mobile/`).

## Assertions checklist

| # | Assertion | How verified |
|---|-----------|----------------|
| 1 | Brand red (not navy) | Visual + `data-token-debug="brand-500"` probe (`rgb(123, 31, 31)` target for `#7B1F1F`) |
| 2 | Logo + institution | Sidebar `img` + topbar title; no “CrediCefi” in hero when using MX fixture + `AuthProvider` display-name overlay for mx build |
| 3 | MXN + `Intl` | `formatForgeCurrency` with `es-MX` / `MXN` |
| 4 | Dates `es-MX` | `toLocaleString` / `DateTimeFormat` with tenant locale |
| 5 | Spanish UI | `es-MX` bundle + regulatory surface Spanish |
| 6 | CNBV profile | Compliance hero from `regulatory_profile: "CNBV_MX"` |
| 7 | Diff scope | Phase 6 intentionally includes wiring fixes (tenant on `.forge-app`, chrome, bank/dealer copy) so config drives UI — see git history for this commit |
| 8 | Lighthouse a11y | Run against `/credit-hub/preview` with mx flag; target ≥ 0.95 |

## Status

**PASS** — after gates in session (build, Lighthouse JSON, axe, screenshots).

## Constraints discovered

- **Brand contrast:** Deep `brand-900` sidebar header uses light ink tokens for text; if Lighthouse flags contrast on other surfaces, tighten tokens or require **validated contrast at tenant onboarding** (documented expectation for Phase 8).
