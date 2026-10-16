#!/usr/bin/env bash
# Prueba de hecho de PS-5-CARGA-CONTABLE (dashboard_ci). Ultima linea: RESULT_PS_5_CARGA_CONTABLE=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://backend.test}"
if npx jest components/contable/tests/dashboard-ejecutivo-carga --ci --passWithNoTests=false; then
  echo "RESULT_PS_5_CARGA_CONTABLE=PASS"
else
  echo "RESULT_PS_5_CARGA_CONTABLE=FAIL"
  exit 1
fi
