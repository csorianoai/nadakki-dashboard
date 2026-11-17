#!/usr/bin/env bash
# Prueba de hecho de ROP-G5-VISITA-UI (dashboard_ci). Ultima linea: RESULT_ROP_G5_VISITA_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/realtor/smart-calendar --ci --passWithNoTests=false; then
  echo "RESULT_ROP_G5_VISITA_UI=PASS"
else
  echo "RESULT_ROP_G5_VISITA_UI=FAIL"
  exit 1
fi
