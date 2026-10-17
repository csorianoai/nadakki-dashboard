#!/usr/bin/env bash
# Prueba de hecho de PS-5-CARGA-LEGAL (dashboard_ci). Ultima linea: RESULT_PS_5_CARGA_LEGAL=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://backend.test}"
if npx jest __tests__/legal/cases/LegalCasesPage --ci --passWithNoTests=false; then
  echo "RESULT_PS_5_CARGA_LEGAL=PASS"
else
  echo "RESULT_PS_5_CARGA_LEGAL=FAIL"
  exit 1
fi
