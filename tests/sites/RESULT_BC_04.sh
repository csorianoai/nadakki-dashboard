#!/usr/bin/env bash
# Prueba de hecho de BC-04-RESUMEN-MARKETING: panel de marketing del Resumen + suite de Sites. Ultima linea: RESULT_BC_04=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_BC_04=PASS"
else
  echo "RESULT_BC_04=FAIL"
  exit 1
fi
