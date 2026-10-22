#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-8C (dashboard_ci). Ultima linea: RESULT_DB_CODEX_8C=PASS | FAIL.
# Idempotency-Key estable por borrador en /multi-lender/execute: misma clave en reintentos,
# claves distintas por borrador, clave nueva tras exito y sin doble envio por doble clic.
set -u
cd "$(dirname "$0")/../../../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npx jest components/forge/credit-hub/dealer/tests/submit-idempotency.test.tsx lib/credit-hub/api/tests/submitIdempotency.test.ts tests/credit-hub/api/client.test.ts tests/credit-hub/dealer/wizard/wizard-submit-failed.test.tsx --ci; then
  echo "RESULT_DB_CODEX_8C=PASS"
else
  echo "RESULT_DB_CODEX_8C=FAIL"
  exit 1
fi
