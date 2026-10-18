#!/usr/bin/env bash
# Prueba de hecho de PS-10-REALTOR-QA-ACCESO (dashboard_ci). Ultima linea: RESULT_PS_10_REALTOR_QA_ACCESO=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx tsc --noEmit -p . \
  && npx jest tests/realtor/acceso-fail-closed.test.tsx tests/realtor/alta-page-demo.test.tsx tests/realtor/AltaAsistente.test.tsx tests/realtor/menu.test.tsx -t '^(?!.*todas las rutas)' --ci; then
  echo "RESULT_PS_10_REALTOR_QA_ACCESO=PASS"
else
  echo "RESULT_PS_10_REALTOR_QA_ACCESO=FAIL"
  exit 1
fi
