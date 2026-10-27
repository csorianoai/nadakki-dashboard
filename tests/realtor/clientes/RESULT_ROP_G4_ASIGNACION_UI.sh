#!/usr/bin/env bash
# Prueba de hecho de ROP-G4-ASIGNACION-UI (dashboard_ci). Ultima linea: RESULT_ROP_G4_ASIGNACION_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest tests/realtor/clientes --ci --passWithNoTests=false; then
  echo "RESULT_ROP_G4_ASIGNACION_UI=PASS"
else
  echo "RESULT_ROP_G4_ASIGNACION_UI=FAIL"
  exit 1
fi
