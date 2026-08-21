# Dealer–Bank Scope Baseline v6.1

**Loop:** Dealer–Bank Core Completion Loop v6.1 FINAL  
**Status:** LOCKED  
**Updated:** 2026-07-22  

## Classification legend

| Class | Meaning |
|-------|---------|
| MANDATORY_LAUNCH | Required for CORE_PRODUCTION_READY |
| MANDATORY_POST_LAUNCH | After launch unless contract requires sooner |
| OPTIONAL_INTEGRATION | External / add-on; does not block core |
| COMMERCIAL_DECISION_PENDING | Packaging/pricing not approved; infra may exist |
| OUT_OF_SCOPE | Explicitly excluded |

## MANDATORY_LAUNCH (36)

| # | Capability area | Current status | Evidence |
|---|-----------------|----------------|----------|
| 1 | Dealer onboarding | PARTIAL | Forge login; autos dealer hub exists |
| 2 | Dealer profile | PARTIAL | Backend dealers table; UI partial |
| 3 | Dealer users | PARTIAL | Auth V2 + RBAC in backend |
| 4 | Dealer RBAC | PARTIAL | Role checks in routers |
| 5 | Universal inventory CRUD | IMPLEMENTING | Backend vehicle service; universal policy added locally |
| 6 | Unlimited inventory publishing | IMPLEMENTING | `universal_baseline.py` + migration 092 NULL limits |
| 7 | Vehicle search | PASS (staging/prod) | POST search 200; p95 needs tuning |
| 8 | Vehicle detail | FAIL prod | P0-001: GET `/vehicles/{id}` → 500 (SQL cast bug; fix local) |
| 9 | Marketplace | PARTIAL | AP-5 smoke 20/20; seed fallback when empty |
| 10 | Cart and compare | PARTIAL | Frontend localStorage; AP-2 partial |
| 11 | Lead capture | PARTIAL | AP-3 router exists; prod requires JWT |
| 12 | Dealer lead routing | PARTIAL | Credit Hub separate path |
| 13 | Financing calculator | PASS | POST calculate 200 |
| 14 | Financing application | PARTIAL | Credit Hub v2 canonical; autos finance 404 |
| 15 | Bank eligibility | PARTIAL | Credit Hub backend |
| 16 | Bank queue | PARTIAL | Credit Hub bank views |
| 17 | Offer creation | PARTIAL | v2 credit offers API |
| 18 | Multiple-offer comparison | PARTIAL | Credit Hub UI |
| 19 | Offer selection | PARTIAL | v2 accept endpoint |
| 20 | Offer acceptance | PARTIAL | Auth required |
| 21 | Document workflow | FAIL | Credit Hub NOT_READY bank pilot |
| 22 | Notifications | PARTIAL | Credit Hub notifications partial |
| 23 | Messaging | FAIL | Not wired end-to-end |
| 24 | Admin Network Cockpit | FAIL | `app/admin/autos/*` absent on branch |
| 25 | Capability catalog | IMPLEMENTING | Migration 097 + registry |
| 26 | Entitlement resolver | IMPLEMENTING | EntitlementService + universal bypass |
| 27 | Universal auto baseline | IMPLEMENTING | `universal_baseline.py` (local) |
| 28 | Tenant isolation | PARTIAL | RLS on tenant tables; tests exist |
| 29 | Audit trail | PARTIAL | application_events; autos lead events |
| 30 | Security controls | PARTIAL | JWT, RLS; mis-leads auth gap |
| 31 | Performance targets | FAIL | Search p95 > 500ms target |
| 32 | Observability | PARTIAL | Structured logging present |
| 33 | Staging deployment | UNKNOWN | Requires deploy pipeline verification |
| 34 | Production deployment | PARTIAL | Backend/frontend live; fixes not deployed |
| 35 | AP-1 through AP-5 regression | PARTIAL | AP-5 pass; AP-4 admin missing |
| 36 | E2E mandatory suite | FAIL | E2E-01–15 not fully executed |

## COMMERCIAL_DECISION_PENDING

Plan names, prices, annual pricing, capability-to-plan mapping, add-ons, usage billing, bundles, discounts, trials, contract minimums, negotiated packages — **all deferred**. Does not block core technical work.

## MANDATORY_POST_LAUNCH

Full accounting, bank reconciliation, advanced forecasting/BI, multi-location accounting, automated invoicing, advanced subscription billing.

## OPTIONAL_INTEGRATION

SuperCarros, external inventory providers, third-party bank APIs, CRM connectors, accounting connectors, social marketplace publication.

## Universal inventory rule (inviolable)

All active auto dealer memberships: **unlimited vehicle publication**. No commercial cap by plan or price.
