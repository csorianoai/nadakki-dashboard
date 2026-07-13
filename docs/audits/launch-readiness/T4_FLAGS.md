# T4.1 — Feature Flags Pre-Launch

**Date:** 2026-07-13

---

## Required flags (launch contract) vs implementation

| Required flag | Implemented? | Actual mechanism | Control surface |
|---------------|--------------|------------------|-----------------|
| `CREDIT_HUB_TENANT_ENABLED` | ❌ **Missing** | `tenant_feature_flags.credit_pipeline_v2` (DB) | Supabase + migration 053 |
| `CREDIT_HUB_APPLICATIONS_ENABLED` | ❌ **Missing** | No dedicated kill switch | — |
| `CREDIT_HUB_APPROVALS_ENABLED` | ❌ **Missing** | No dedicated kill switch | — |
| `CREDIT_HUB_INTEGRATIONS_ENABLED` | ❌ **Missing** | `FEATURE_MULTI_LENDER_ENABLED` env (partial) | Render env |
| Per-tenant granular | ⚠️ Partial | `tenant_feature_flags` table | DB row per tenant |
| Vercel env without redeploy | ⚠️ Partial | `NEXT_PUBLIC_*` require rebuild | Vercel env vars |

---

## Existing flags (mapped equivalents)

### Backend (`nadakki-ai-suite`)

| Flag | Default | File |
|------|---------|------|
| `CREDIT_PIPELINE_V2_ENABLED` | env | `config/credit_pipeline_flags.py` |
| `FEATURE_MULTI_LENDER_ENABLED` | `false` (fail-closed) | `services/credit/adapters/factory_v2.py` |
| `NADAKKI_MULTI_LENDER_DISPATCH_ENABLED` | JSON per-tenant | `services/feature_flags/multi_lender_dispatch_flag.py` |
| `tenant_feature_flags.credit_pipeline_v2` | seeded per tenant | migration 053 |
| `tenant_feature_flags.multi_lender_dispatch` | seeded | migration 053 |
| `tenant_feature_flags.is_demo` | per tenant | auth service |
| `S3_ENABLED` | `false` | `services/credit/documents/storage.py` |
| `BILLING_DISABLED=1` | off | `main.py` (billing kill) |
| `TENANT_MODULE_ADMIN_ENABLED` | off | `tenant_module_admin_router.py` |

### Frontend (`nadakki-dashboard`)

| Flag | Default | File |
|------|---------|------|
| `NEXT_PUBLIC_BANK_PILOT_UI` | `true` | `lib/env/feature-bank-pilot-ui.ts` |
| `NEXT_PUBLIC_CH_NOTIFICATIONS` | **off** | `lib/env/feature-ch-notifications.ts` |
| `NEXT_PUBLIC_FF_FORGE_MONETIZACION` | off | `lib/env/feature-forge-monetizacion.ts` |
| `NEXT_PUBLIC_FORGE_TEST_TENANT` | unset | **must not set in prod** |
| `routeone_parity_enabled` | backend-driven | `useFeatureFlag.ts` |

---

## Cohort configuration (6 tenants — pending human)

| Tenant slot | Type | `CREDIT_HUB_TENANT_ENABLED` | Owner |
|-------------|------|-------------------------------|-------|
| Pilot 1 | Dealer | Ramon to assign | — |
| Pilot 2 | Dealer | Ramon to assign | — |
| Pilot 3 | Dealer | Ramon to assign | — |
| Pilot 4 | Bank | Ramon to assign | — |
| Pilot 5 | Bank | Ramon to assign | — |
| Pilot 6 | Nadakki internal | Demo/monitor | — |

**Action required:** Ramon selects tenant UUIDs. Enable `credit_pipeline_v2=true` in `tenant_feature_flags` per row.

---

## Gap remediation plan

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Add `CREDIT_HUB_*` env aliases mapping to existing flags (aditivo) | 4h |
| P0 | Admin kill-switch endpoint `/api/v1/admin/kill-switch/{feature}` | 8h |
| P1 | Document flag → env mapping in runbook | 2h |
| P1 | Vercel env vars for frontend kills (build-time limitation documented) | — |

---

## Gate T4.1 verdict

**NOT MET** — Required `CREDIT_HUB_*` flags not implemented as specified. Partial equivalents exist. Cohort not configured (human decision).
