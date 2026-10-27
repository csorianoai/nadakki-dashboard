#!/usr/bin/env bash
# Prueba de hecho de ROP-G6-HISTORIAL-UI (dashboard_ci). Última línea: RESULT_ROP_G6_HISTORIAL_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/realtor/operaciones --ci; then
  echo "RESULT_ROP_G6_HISTORIAL_UI=PASS"
else
  echo "RESULT_ROP_G6_HISTORIAL_UI=FAIL"
  exit 1
fi
