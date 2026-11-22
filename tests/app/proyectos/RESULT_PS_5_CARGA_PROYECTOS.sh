#!/usr/bin/env bash
# Prueba de hecho de PS-5-CARGA-PROYECTOS (dashboard_ci). Ultima linea: RESULT_PS_5_CARGA_PROYECTOS=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/app/proyectos/panel-carga --ci --passWithNoTests=false; then
  echo "RESULT_PS_5_CARGA_PROYECTOS=PASS"
else
  echo "RESULT_PS_5_CARGA_PROYECTOS=FAIL"
  exit 1
fi
