# Universal Auto Inventory Baseline

**Policy:** `ALWAYS_ENABLED_FOR_ACTIVE_AUTO_DEALER`  
**Implementation:** `nadakki-ai-suite/services/autos_portal/universal_baseline.py`

## Capabilities (always enabled for active auto dealers with subscription)

```
inventory.vehicle.create
inventory.vehicle.read
inventory.vehicle.update
inventory.vehicle.archive
inventory.vehicle.publish
inventory.vehicle.unpublish
inventory.vehicle.full_catalog
inventory.capacity.unlimited
marketplace.vehicle.visibility
marketplace.vehicle.detail
```

## Legacy aliases (production compatibility)

```
inventory_active
autos.inventory.create
autos.inventory.list
autos.search.marketplace
```

## Precedence

Universal policy applies **after** auth, tenant scope, and RBAC. It does **not** consult price, plan tier, or vehicle count.

## Database alignment

Migration `092_autos_portal_foundation.py` seeds `inventory_active` with `value_limit = NULL` (unlimited) for conecta/crece/domina.

## Verification status

| Check | Status |
|-------|--------|
| Code policy defined | PASS (local) |
| Entitlement resolver honors universal | PASS (local tests) |
| Production verified | FAIL (deploy pending) |
| E2E-03/E2E-04 parity | NOT RUN |
