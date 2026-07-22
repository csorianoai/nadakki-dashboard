# Dealer–Bank Capability Catalog (summary)

**Source of truth (backend):** `capabilities` table (migration 097) + `services/autos_portal/capability_registry.py`  
**Universal policy:** `services/autos_portal/universal_baseline.py`

## Universal (ALWAYS_ENABLED_FOR_ACTIVE_AUTO_DEALER)

See [DEALER_BANK_UNIVERSAL_BASELINE.md](./DEALER_BANK_UNIVERSAL_BASELINE.md).

## Entitlement-controlled (EXPLICIT_ENTITLEMENT_REQUIRED)

Examples registered in migration 097:

| Key | Domain | Metric |
|-----|--------|--------|
| autos.inventory.photos | autos | count |
| autos.inventory.video | autos | count |
| autos.leads.crm | autos | boolean |
| autos.analytics.advanced | autos | boolean |
| autos.api.access | autos | boolean |
| marketing.social.publish | marketing | count |
| credit.applications.submit | credit | count |

Commercial assignment to plans: **DECISION_PENDING**.

## Legacy plan_entitlements keys (migration 092)

| Capability | Conecta | Crece | Domina |
|------------|---------|-------|--------|
| inventory_active | unlimited | unlimited | unlimited |
| photos_per_vehicle | 12 | 25 | unlimited |
| ai_features | disabled | disabled | enabled |

**Note:** `inventory_active` is superseded by universal baseline for publication limits.
