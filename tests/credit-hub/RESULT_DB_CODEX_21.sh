#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-21 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_21=PASS | FAIL.
# typecheck y jest de bank-v2 (incluye NombresSinUuid) y de los componentes v1 del banco.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest components/credit-hub/bank-v2 components/credit-hub/bank tests/credit-hub/bank/BankDetailLayout.test.tsx tests/credit-hub/bank/pages/detail-review.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_DB_CODEX_21=PASS"
else
  echo "RESULT_DB_CODEX_21=FAIL"
  exit 1
fi
