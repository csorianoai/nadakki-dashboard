#!/usr/bin/env bash
# Prueba de hecho de ST5A-06 (Contactos): jest + eslint --max-warnings 0 + tsc. Ultima linea: RESULT_ST5A_06=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
AREA="components/sites/contactos lib/sites/contactos app/mi-web/contactos tests/sites/contactos.test.tsx"
if npx jest tests/sites --ci --passWithNoTests=false && npx eslint $AREA lib/sites/client.ts --ext .ts,.tsx --max-warnings 0 && npx tsc --noEmit; then
  echo "RESULT_ST5A_06=PASS"
else
  echo "RESULT_ST5A_06=FAIL"
  exit 1
fi
