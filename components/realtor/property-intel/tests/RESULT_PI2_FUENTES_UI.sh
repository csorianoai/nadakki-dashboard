#!/usr/bin/env bash
# Prueba de hecho de PI-2 fuentes públicas de la zona en la ficha (ACS, permisos de Miami, DOR). Última línea: RESULT_PI2_FUENTES_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest components/realtor/property-intel tests/realtor/property-intel --ci; then
  echo "RESULT_PI2_FUENTES_UI=PASS"
else
  echo "RESULT_PI2_FUENTES_UI=FAIL"
  exit 1
fi
