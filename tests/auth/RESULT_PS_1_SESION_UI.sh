#!/usr/bin/env bash
# Prueba de hecho de PS-1-SESION-UI (dashboard_ci). Ultima linea: RESULT_PS_1_SESION_UI=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://backend.test}"
if npx jest tests/auth/cambio-contrasena-obligatorio --ci --passWithNoTests=false; then
  echo "RESULT_PS_1_SESION_UI=PASS"
else
  echo "RESULT_PS_1_SESION_UI=FAIL"
  exit 1
fi
