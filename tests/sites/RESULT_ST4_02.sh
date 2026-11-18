#!/usr/bin/env bash
# Prueba de hecho de ST4-02 (Mi web: armazon y Resumen, partes 1/2 y 2/2). Ultima linea: RESULT_ST4_02=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_ST4_02=PASS"
else
  echo "RESULT_ST4_02=FAIL"
  exit 1
fi
