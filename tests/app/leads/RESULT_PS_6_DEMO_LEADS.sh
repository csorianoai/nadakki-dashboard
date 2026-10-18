#!/usr/bin/env bash
# Prueba de hecho de PS_6_DEMO_LEADS (dashboard_ci). Ultima linea: RESULT_PS_6_DEMO_LEADS=PASS | FAIL.
# Junto a su test, no en superloop/dashboard_ci.sh: ese fichero es compartido y cada tarjeta que lo reescribia chocaba con las demas.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/app/leads/demo-badge.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_PS_6_DEMO_LEADS=PASS"
else
  echo "RESULT_PS_6_DEMO_LEADS=FAIL"
  exit 1
fi
