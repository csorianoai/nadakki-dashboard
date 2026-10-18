#!/usr/bin/env bash
# Prueba de hecho de PS-10-REALTOR-QA-ACCESO (dashboard_ci). Ultima linea: RESULT_PS_10_REALTOR_QA_ACCESO=PASS | FAIL.
# typecheck + jest de las suites de PS-10 + next build. La suite de la PARTE 1/2 (tests/realtor/acceso*.test.*)
# se incluye si ya esta en el arbol; no se lanza `jest tests/realtor` entero (hay fallos previos ajenos).
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
suites=(tests/auth/aterrizaje-realtor.test.tsx)
for f in tests/realtor/acceso-fail-closed.test.tsx tests/realtor/acceso.test.ts; do
  [ -f "$f" ] && suites+=("$f")
done
if npm run typecheck && npx jest "${suites[@]}" --ci --passWithNoTests=false && npm run build; then
  echo "RESULT_PS_10_REALTOR_QA_ACCESO=PASS"
else
  echo "RESULT_PS_10_REALTOR_QA_ACCESO=FAIL"
  exit 1
fi
