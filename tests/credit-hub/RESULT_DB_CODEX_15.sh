#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-15 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_15=PASS | FAIL.
# (a) grep de console.log/info/debug en las rutas del expediente v1 = 0, (b) jest anti-console,
# (c) eslint con no-console sobre esas rutas, (d) jest de los tests existentes de bank.
set -u
cd "$(dirname "$0")/../.." || exit 1
hits=$(grep -rnE "console\.(log|info|debug)" "app/(forge)/credit-hub/bank" components/credit-hub/bank lib/credit-hub/hooks/useBank* 2>/dev/null | wc -l)
if [ "$hits" -eq 0 ] \
  && npx jest tests/credit-hub/no-console-bank.test.ts --ci --passWithNoTests=false \
  && npx eslint "app/(forge)/credit-hub/bank" components/credit-hub/bank --ext .ts,.tsx --max-warnings=100000 \
  && npx jest tests/credit-hub/bank --ci --passWithNoTests; then
  echo "RESULT_DB_CODEX_15=PASS"
else
  echo "RESULT_DB_CODEX_15=FAIL"
  exit 1
fi
