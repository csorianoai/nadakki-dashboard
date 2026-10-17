#!/usr/bin/env bash
# Prueba de hecho de PS-5-CARGA-MARKET-INTEL (dashboard_ci). Ultima linea: RESULT_PS_5_CARGA_MARKET_INTEL=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://backend.test}"
if npx jest tests/market-intel/market-intel-client-load --ci --passWithNoTests=false; then
  echo "RESULT_PS_5_CARGA_MARKET_INTEL=PASS"
else
  echo "RESULT_PS_5_CARGA_MARKET_INTEL=FAIL"
  exit 1
fi
