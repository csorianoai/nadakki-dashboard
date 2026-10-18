#!/usr/bin/env bash
# Prueba de hecho de PS-14-PI-ENTRADA (dashboard_ci). Última línea: RESULT_PS_14_PI_ENTRADA=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest components/realtor/property-intel marketing/signals tests/nav/manifiesto-paginas.test.ts --ci; then
  echo "RESULT_PS_14_PI_ENTRADA=PASS"
else
  echo "RESULT_PS_14_PI_ENTRADA=FAIL"
  exit 1
fi
