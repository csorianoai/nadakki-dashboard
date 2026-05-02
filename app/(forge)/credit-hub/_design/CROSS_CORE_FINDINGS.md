# Cross-core findings surfaced during Forge redesign

This note records a **tenant identity inconsistency** discovered during Phase 1.5 investigation of `DEFAULT_CREDIT_TENANT_ID`. It is **out of scope** for the Forge Credit Hub redesign. It is filed here so the finding is not lost; **Cesar** should route reconciliation to **backend / Legal / Marketing** as appropriate. **Forge does not consume this UUID.**

---

## Tenant identity conflict (`366b3c6c-a899-4320-805e-5c1d7c896f74`)

### Evidence

1. **Legal documentation** (`nadakki-ai-suite`, read-only during investigation)  
   - File: `docs/legal_phase2_completion_report.md`  
   - Line 5 (example): states tenant piloto **Credicefi** with UUID **`366b3c6c-a899-4320-805e-5c1d7c896f74`**.

2. **Marketing / control-plane style artifacts** (`nadakki-ai-suite`)  
   - File: `release_verification_report.json`  
   - Contains JSON associating **`tenant_id":"366b3c6c-a899-4320-805e-5c1d7c896f74"`** with **`tenant_slug":"sf-rentals-nadaki-excursions"`**.  
   - File: `services/tenant_marketing_key.py`  
   - Maps UUID **`366b3c6c-a899-4320-805e-5c1d7c896f74`** → **`sf-rentals-nadaki-excursions`**.

### Implication

The same UUID is **labeled as Credicefi** in one legal report and **bound to sf-rentals-nadaki-excursions** in marketing/control-plane data. This is a **cross-core consistency** issue, not a Forge token or `DEFAULT_CREDIT_TENANT_ID` issue.

### Forge scope

Forge / Credit Hub default tenant for API fallback remains **`0a91ee98-2dbe-46d0-a43c-3fc2dbd42242`** (Credicefi), per canonical evidence in `BLOCKER_phase1.5.md` resolution and `lib/credit-hub/types/creditCore.ts` JSDoc. **No Forge code should assume `366b3c6c-…` without team-wide reconciliation.**

### Sprint disposition (identity / control-plane)

**Deferred to a backend / cross-core identity reconciliation sprint.** This inconsistency **does not block** Forge Credit Hub **v1.0** production release. Dashboard code must not depend on UUID **`366b3c6c-a899-4320-805e-5c1d7c896f74`** until product + legal agree a single canonical binding.

---

*Filed Phase 2 prep window, 2026-05-01.*
