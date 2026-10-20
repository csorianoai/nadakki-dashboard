#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_1 (dashboard_ci). Última línea: RESULT_PS_9_CARCASAS_1=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh (compartido).
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/nav tests/credit-hub/monetizacion tests/credit-hub/bank tests/credit-hub/shell tests/credit-hub/dealer tests/credit-hub/foundation --ci; then
  echo "RESULT_PS_9_CARCASAS_1=PASS"
else
  echo "RESULT_PS_9_CARCASAS_1=FAIL"
  exit 1
fi
