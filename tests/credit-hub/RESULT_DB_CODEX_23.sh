#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-23 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_23=PASS | FAIL.
# typecheck, guard de texto visible, herramientas con ambito del portal y jest de bank-v2.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest components/credit-hub/bank-v2 tests/credit-hub/guard tests/nav/herramientas-bank-v2.test.tsx tests/credit-hub/bank/pages/compliance.test.tsx tests/credit-hub/dealer/DealerProfileView.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_DB_CODEX_23=PASS"
else
  echo "RESULT_DB_CODEX_23=FAIL"
  exit 1
fi
