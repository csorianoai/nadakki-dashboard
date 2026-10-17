#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-2 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_2=PASS | FAIL.
# typecheck, jest de tests/credit-hub/dealer y tests/credit-hub/api y next build, los tres con heap de 4 GB:
# con 1,5 GB y con 2 GB `next build` abortaba con "JavaScript heap out of memory" en el runner.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest tests/credit-hub/dealer tests/credit-hub/api --ci --passWithNoTests=false && npm run build; then
  echo "RESULT_DB_CODEX_2=PASS"
else
  echo "RESULT_DB_CODEX_2=FAIL"
  exit 1
fi
