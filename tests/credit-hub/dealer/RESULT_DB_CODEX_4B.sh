#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-4B (dashboard_ci). Ultima linea: RESULT_DB_CODEX_4B=PASS | FAIL.
# Evidencia completa: superloop/dashboard_ci.sh (typecheck, jest relacionados, build). Aqui, el gate de consentimiento.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest --ci tests/credit-hub/dealer/wizard/consent tests/credit-hub/dealer/wizard/consent-client; then
  echo "RESULT_DB_CODEX_4B=PASS"
else
  echo "RESULT_DB_CODEX_4B=FAIL"
  exit 1
fi
