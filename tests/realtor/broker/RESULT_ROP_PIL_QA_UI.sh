#!/usr/bin/env bash
# Prueba de hecho de ROP-PIL-QA-UI (dashboard_ci). Ultima linea: RESULT_ROP_PIL_QA_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/realtor/broker --ci --passWithNoTests=false; then
  echo "RESULT_ROP_PIL_QA_UI=PASS"
else
  echo "RESULT_ROP_PIL_QA_UI=FAIL"
  exit 1
fi
