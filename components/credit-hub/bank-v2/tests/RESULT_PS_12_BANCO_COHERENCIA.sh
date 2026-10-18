#!/usr/bin/env bash
# Prueba de hecho de PS-12-BANCO-COHERENCIA (dashboard_ci). Ultima linea: RESULT_PS_12_BANCO_COHERENCIA=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://backend.test}"
if npx jest components/credit-hub/bank-v2/tests/CoherenciaDetalleHerramientas tests/nav/herramientas-bank-v2-guardas tests/credit-hub/bank/BankDetailLayout --ci --passWithNoTests=false; then
  echo "RESULT_PS_12_BANCO_COHERENCIA=PASS"
else
  echo "RESULT_PS_12_BANCO_COHERENCIA=FAIL"
  exit 1
fi
