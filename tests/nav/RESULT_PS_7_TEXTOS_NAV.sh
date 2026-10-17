#!/usr/bin/env bash
# Prueba de hecho de PS-7-TEXTOS-NAV (dashboard_ci). Ultima linea: RESULT_PS_7_TEXTOS_NAV=PASS | FAIL.
# typecheck, jest de tests/nav y next build, los tres con heap de 4 GB: el heap por defecto de node (~1,5 GB)
# hacia abortar `next build` con "JavaScript heap out of memory" en el runner.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest tests/nav --ci --passWithNoTests=false && npm run build; then
  echo "RESULT_PS_7_TEXTOS_NAV=PASS"
else
  echo "RESULT_PS_7_TEXTOS_NAV=FAIL"
  exit 1
fi
