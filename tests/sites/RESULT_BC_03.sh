#!/usr/bin/env bash
# Prueba de hecho de BC-03-IMPORTAR-PANEL: jest del conector de portales + suite de Sites. Ultima linea: RESULT_BC_03=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false; then
  echo "RESULT_BC_03=PASS"
else
  echo "RESULT_BC_03=FAIL"
  exit 1
fi
