#!/usr/bin/env bash
# Prueba de hecho de ROP-P4-BROKER-UI (dashboard_ci). Ultima linea: RESULT_ROP_P4_BROKER_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/realtor/broker --ci --passWithNoTests=false; then
  echo "RESULT_ROP_P4_BROKER_UI=PASS"
else
  echo "RESULT_ROP_P4_BROKER_UI=FAIL"
  exit 1
fi
