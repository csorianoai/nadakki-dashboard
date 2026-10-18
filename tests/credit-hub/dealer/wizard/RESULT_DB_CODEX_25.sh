#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-25 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_25=PASS | FAIL.
# typecheck y jest del asistente del concesionario: guarda de pasos, salida sin cambios,
# completitud sobre los pasos reales y los tests de StepApplicant/StepConsent/StepVehicle.
set -u
cd "$(dirname "$0")/../../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest tests/credit-hub/dealer/wizard --ci --passWithNoTests=false; then
  echo "RESULT_DB_CODEX_25=PASS"
else
  echo "RESULT_DB_CODEX_25=FAIL"
  exit 1
fi
