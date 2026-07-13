# T1.4 — Multi-Tenancy RLS Audit

**Date:** 2026-07-13  
**Backend:** `nadakki-ai-suite` (Render + Supabase PostgreSQL)

---

## RLS policy inventory (migrations)

### Global enforcement
Migration `014_force_rls_all_tenant_tables.py` applies **FORCE ROW LEVEL SECURITY** to all `public` tables with `tenant_id` where `relrowsecurity=true`.

Regression test: `tests/onboarding/test_rls_regression.py` expects **≥30** `ENABLE ROW LEVEL SECURITY` statements.

### Credit Hub operational tables (RLS enabled)

| Table | Migration |
|-------|-----------|
| `credit_applications` | `credit_tables.sql`, `credit_unify_v2.sql` |
| `application_events` | same |
| `application_documents` | `credit_documents_sprint12.sql` |
| `application_offers` | `012_application_offers.py` |
| `credit_consent_events` | `credit_consent_events.sql` |
| `bank_credentials` | `022_bank_credentials_schema.py` |
| `bank_claims` | `028_bank_claims_table.py` |
| `stipulations` | `017_create_stipulations_table.py` |
| `tenant_feature_flags` | `053_tenant_feature_flags.py` |
| `user_dealer_assignments`, `user_lender_assignments` | `056_ownership_isolation.py` |
| `credit_notifications` | `069_credit_notifications.py` |
| `credit_document_requests` | `073_credit_document_requests.py` |
| `credit_application_messages` | `074_credit_application_messages.py` |
| `credit_bank_notes` | `075_bank_notes_assignments.py` |
| + 20 additional credit-adjacent tables | migrations 032–075 |

**Runtime DDL:** `services/credit/persistence_db.py` also enables RLS on `credit_applicants`, `credit_vehicles`, `credit_bank_offers`, etc.

### App-layer RLS middleware
`backend/db/rls.py` — JWT `tenant_id` enforcement, superadmin bypass, header rewrite. Mounted in `main.py` before rate limiter.

---

## Live DB query status

```sql
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables WHERE schemaname='public';
```

**Status:** **BLOCKED** — No production DB credentials on audit host (by design).  
**Proxy evidence:** 862 parameterized cross-tenant spoof tests PASS in `test_tenant_isolation_contract.py`.

---

## Cross-tenant test suite results

**Executed:** 2026-07-13 local pytest

| Suite | Tests | Result |
|-------|-------|--------|
| `tests/security/test_tenant_isolation_contract.py` | 800+ route matrix | **PASS** |
| `tests/data_validation/test_tenant_data_isolation.py` | data layer | **PASS** |
| `tests/security/test_auth_bypass.py` | auth negative | **1 FAIL** (flake, not leak) |
| `tests/stipulations/test_isolation.py` | stipulations | In suite above |
| `tests/legal/expedientes/test_cross_tenant_isolation.py` | legal (adjacent) | Not re-run this pass |

**Synthetic 3-tenant interleaved probe (production HTTP):** Not executed — requires JWT fixtures for 3 tenants. Recommend automated probe every 15 min post-launch (T4.3).

---

## Frontend tenant isolation gap

| ID | Sev | Finding |
|----|-----|---------|
| **P0-FE-001** | **P0** | `useTenant.ts` falls back to `NEXT_PUBLIC_DEFAULT_TENANT_ID` when session empty — bypasses session requirement |
| P1-FE-002 | P1 | `middleware.ts` passes unauthenticated `/api/*` through (backend RLS is authority) — acceptable if backend always enforces |

---

## Gate T1.4 verdict

**CONDITIONAL PASS** — Backend RLS contract tests green (862/863).  
**FAIL on frontend P0-FE-001** — must fix before launch cohort.  
**Residual:** Live `pg_tables` query + 100-request interleaved prod probe pending (external dependency: prod JWTs).
