#!/usr/bin/env bash
# Prueba de hecho de PS_6_DEMO_SIC_REPORTES (dashboard_ci). Ultima linea: RESULT_PS_6_DEMO_SIC_REPORTES=PASS | FAIL.
# Junto a su test, no en superloop/dashboard_ci.sh: ese fichero es compartido y cada tarjeta que lo reescribia chocaba con las demas.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/app/sic/reportes-demo.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_PS_6_DEMO_SIC_REPORTES=PASS"
else
  echo "RESULT_PS_6_DEMO_SIC_REPORTES=FAIL"
  exit 1
fi
