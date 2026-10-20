#!/usr/bin/env bash
# Prueba de hecho de PI-2 PI-VISIBLE, entrada del menú (DASH-REALTOR). Última línea: RESULT_PI2_MENU=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/realtor tests/nav/manifiesto-paginas.test.ts tests/nav/migas-realtor.test.ts --ci; then
  echo "RESULT_PI2_MENU=PASS"
else
  echo "RESULT_PI2_MENU=FAIL"
  exit 1
fi
