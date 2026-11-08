#!/usr/bin/env bash
# Prueba de hecho de ST4-03 (editor de paginas y textos). Ultima linea: RESULT_ST4_03=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_ST4_03=PASS"
else
  echo "RESULT_ST4_03=FAIL"
  exit 1
fi
