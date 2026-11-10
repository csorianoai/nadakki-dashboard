#!/usr/bin/env bash
# Prueba de hecho de ST4-06 (desarrollos, zonas y edificios). Ultima linea: RESULT_ST4_06=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_ST4_06=PASS"
else
  echo "RESULT_ST4_06=FAIL"
  exit 1
fi
