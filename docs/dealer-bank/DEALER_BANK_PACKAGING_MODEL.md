# Dealer–Bank Packaging Model (configurable, commercial decisions deferred)

**Status:** INFRASTRUCTURE_PARTIAL — tables exist; assignments in DRAFT.

## Tables (migration 097)

| Table | Purpose |
|-------|---------|
| `capabilities` | Canonical capability registry |
| `plan_versions` | Immutable plan snapshots |
| `plan_version_capabilities` | Capability grants per version |
| `tenant_subscriptions` | Full lifecycle subscriptions |
| `subscription_add_ons` | Per-tenant add-ons |
| `subscription_overrides` | Grant/revoke/limit overrides |
| `usage_events` / `usage_counters` | Metering |
| `billing_sync_events` | Stripe idempotency |

## Product family

```text
AUTO_DEALER (initial)
```

## Plan state

Commercial plans may remain **DRAFT** until pricing/packaging approved.

## Price–access separation

Price is used only for billing/reconciliation — **never** for functional authorization.

See `DEALER_BANK_COMMERCIAL_DECISIONS_PENDING.md`.
