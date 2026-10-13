#!/usr/bin/env bash
# Prueba de hecho de G2-PANEL-ALTA (dashboard_ci). Ultima linea: RESULT_G2_PANEL=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/realtor --ci --passWithNoTests=false; then
  echo "RESULT_G2_PANEL=PASS"
else
  echo "RESULT_G2_PANEL=FAIL"
  exit 1
fi
