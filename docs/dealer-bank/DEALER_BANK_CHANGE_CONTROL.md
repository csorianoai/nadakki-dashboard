# Dealer–Bank Change Control

| change_id | description | source | reason | current_scope | proposed_scope | mandatory_for_release | decision | evidence |
|-----------|-------------|--------|--------|---------------|----------------|----------------------|----------|----------|
| CC-001 | Fix vehicle detail SQL cast (`:id::uuid` → `CAST`) | P0-001 prod 500 | PostgresSyntaxError on GET vehicle | MANDATORY_LAUNCH | MANDATORY_LAUNCH | yes | APPROVED | Prod probe 500; local fix + 51 tests pass |
| CC-002 | Universal inventory baseline module | Loop v6.1 §1 | No commercial vehicle caps | MANDATORY_LAUNCH | MANDATORY_LAUNCH | yes | APPROVED | `universal_baseline.py` |
| CC-003 | Effective capabilities endpoint | Loop v6.1 §20 | Frontend must not compute permissions | MANDATORY_LAUNCH | MANDATORY_LAUNCH | yes | APPROVED | `GET /api/v1/autos/dealers/{id}/effective-capabilities` |
| CC-004 | Final plan names and prices | Product | Commercial packaging | COMMERCIAL_DECISION_PENDING | — | no | PENDING | — |
| CC-005 | Admin Network Cockpit UI | AP-4 | Ops visibility | MANDATORY_LAUNCH | MANDATORY_LAUNCH | yes | DEFERRED | Branch lacks `app/admin/autos` |
| CC-006 | Credit Hub bank pilot completion | Prior audit | Documents/messaging | MANDATORY_LAUNCH | MANDATORY_POST_LAUNCH | TBD | PENDING | DEALER_BANK_FRONTEND_READINESS_AUDIT |

**Rules:** Universal inventory rule cannot be degraded via ordinary commercial change control.
