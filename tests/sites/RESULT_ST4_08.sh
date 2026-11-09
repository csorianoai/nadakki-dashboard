#!/usr/bin/env bash
# Prueba de hecho de ST4-08 PARTE 1/2 (vista previa, jest). La PARTE 2/2 anade el E2E con axe. Ultima linea: RESULT_ST4_08=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_ST4_08=PASS"
else
  echo "RESULT_ST4_08=FAIL"
  exit 1
fi
