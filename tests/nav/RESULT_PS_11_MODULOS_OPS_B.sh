#!/usr/bin/env bash
# Prueba de hecho de PS_11_MODULOS_OPS_B (dashboard_ci). Ultima linea: RESULT_PS_11_MODULOS_OPS_B=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh: ese fichero es compartido y cada tarjeta que lo reescribia chocaba con las demas.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/nav/modulos-operativos tests/nav/module-shell.test.tsx tests/nav/navegacion-unica.test.tsx tests/nav/modulos-grupos.test.tsx tests/nav/ps-4-admin-real-estate.test.ts tests/nav/aviso-acceso.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_PS_11_MODULOS_OPS_B=PASS"
else
  echo "RESULT_PS_11_MODULOS_OPS_B=FAIL"
  exit 1
fi
