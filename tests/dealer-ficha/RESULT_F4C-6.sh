#!/usr/bin/env bash
# Prueba de hecho de F4C-6: las pruebas de la ficha en GMT-3 (donde ocurre F-23).
set -u
cd "$(dirname "$0")/.." && cd ..
if TZ=America/Argentina/Buenos_Aires npx jest tests/dealer-ficha tests/components/dealer/DealerVehicleEconomicsPage.test.tsx --silent; then
  echo "RESULT_F4C-6=PASS"
else
  echo "RESULT_F4C-6=FAIL"
  exit 1
fi
