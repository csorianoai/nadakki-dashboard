# Dealer–Bank Test Matrix

| ID | Suite | Scope | Last run | Result |
|----|-------|-------|----------|--------|
| BE-AUTOS | pytest tests/autos_portal/ | Backend autos | 2026-07-22 | ~1608 pass (see CI) |
| FE-AUTOS | jest autos-portal\|entitlements | Frontend autos | 2026-07-22 | 54 pass |
| FE-ENT | jest entitlements-api | API client | 2026-07-22 | 4 pass |
| E2E-03 | test_inventory_membership_parity | Universal publish | 2026-07-22 | 6 pass (local) |
| E2E-01–15 | Full E2E harness | End-to-end | — | NOT RUN |
| AP-5 | verify-autos-20-gates.mjs | Marketplace smoke | Prior audit | 20/20 |
| AP-4 | Admin autos | Cockpit | — | FAIL (UI missing) |

## Mandatory E2E checklist

- [ ] E2E-01 Dealer onboarding
- [ ] E2E-02 Inventory CRUD
- [x] E2E-03 Unlimited inventory publication (unit/local)
- [x] E2E-04 Multiple membership parity (unit/local)
- [ ] E2E-05 Bulk import entitlement
- [ ] E2E-06 Marketplace lead
- [ ] E2E-07 Financing application
- [ ] E2E-08 Multiple bank offers
- [ ] E2E-09 Offer race prevention
- [ ] E2E-10 Documents and messaging
- [ ] E2E-11 Admin cockpit
- [ ] E2E-12 Tenant isolation
- [ ] E2E-13 Capability resolution
- [ ] E2E-14 Override audit
- [ ] E2E-15 Production smoke
