#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-27 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_27=PASS | FAIL.
# typecheck y jest de bank-v2 (incluye ExpedienteV2 y ExpedienteBotonesResumen).
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest components/credit-hub/bank-v2 --ci --passWithNoTests=false; then
  echo "RESULT_DB_CODEX_27=PASS"
else
  echo "RESULT_DB_CODEX_27=FAIL"
  exit 1
fi
