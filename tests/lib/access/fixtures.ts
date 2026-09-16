/**
 * Independent fixtures. BACKEND_SHA 0fa36d53980ea34a0c104efebb1c9c2b39e0b3ee
 */
/** routers/autos_core_access_router.py:460-467 */
export const BATCH_200 = {
  results: {
    "autos.inventory.view": { allowed: true, reason_code: "ALLOWED", limit: 100, current_usage: 3 },
    "credit.scoring.run": {
      allowed: false,
      reason_code: "TARGET_CORE_NOT_READY",
      limit: null,
      current_usage: null,
    },
  },
};
/** routers/autos_core_access_router.py:50 */
export const ERROR_401 = { detail: "AUTH_REQUIRED" };
/** routers/autos_bridges.py:118-121 — reason_code in detail */
export const ERROR_403 = {
  detail: { reason_code: "NO_ORGANIZATION_UNIT", capability: "autos.inventory.view" },
};
/** routers/autos_core_access_router.py:276-278 */
export const ERROR_409 = { detail: { reason_code: "SUBSCRIPTION_EXISTS" } };
export const ERROR_422 = { detail: { reason_code: "VALIDATION_ERROR" } };
/**
 * DEFENSIVE_NOT_NATIVE: batch HTTP itself returns 200 with reason_code in results
 * (autos_core_access_router.py:440-467). HTTP 501 TARGET_CORE_NOT_READY is native
 * to entitlement guards on bridges, not the batch route.
 * BACKEND_SHA 0fa36d53980ea34a0c104efebb1c9c2b39e0b3ee
 * routers/autos_bridges.py:136-141, 1041-1048
 */
export const ERROR_501 = {
  detail: {
    reason_code: "TARGET_CORE_NOT_READY",
    capability: "credit.scoring.run",
    readiness: "PENDING_EXTERNAL_ACTIVATION",
  },
};
