#!/usr/bin/env bash
# Prueba de hecho de O3-FIX-MIGAS (dashboard_ci). Ultima linea: RESULT_O3_FIX_MIGAS=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
if npm run typecheck && npx jest tests/nav --ci --passWithNoTests=false; then
  echo "RESULT_O3_FIX_MIGAS=PASS"
else
  echo "RESULT_O3_FIX_MIGAS=FAIL"
  exit 1
fi
