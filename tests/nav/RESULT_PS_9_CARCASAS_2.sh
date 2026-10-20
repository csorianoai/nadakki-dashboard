#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_2 (dashboard_ci). Última línea: RESULT_PS_9_CARCASAS_2=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh (compartido).
# PASS exige primero las pruebas integradas (AppGate + layouts REALES del Dealer OS, el Centro Operativo, la Contabilidad
# del dealer y bank-v2 = UNA barra, la de ModuleShell, sin el menú ni la barra de DealerShell o DccShell); si falta un
# fichero o falla, FAIL sin mirar el resto.
set -u
cd "$(dirname "$0")/../.." || exit 1
INTEGRADAS=(
  tests/nav/ps-9-carcasas-2-capacidades.test.tsx
  tests/nav/ps-9-carcasas-2-dealer-dentro.test.tsx
  tests/nav/ps-9-carcasas-2-integrado.test.tsx
  tests/nav/ps-9-carcasas-2-banco.test.tsx
  tests/nav/ps-9-carcasas-2-contable.test.tsx
)
for f in "${INTEGRADAS[@]}"; do
  if [ ! -f "$f" ]; then
    echo "falta $f"
    echo "RESULT_PS_9_CARCASAS_2=FAIL"
    exit 1
  fi
done
if ! npx jest "${INTEGRADAS[@]}" --ci; then
  echo "RESULT_PS_9_CARCASAS_2=FAIL"
  exit 1
fi
if npx jest tests/nav tests/dealer tests/components/dealer-management components/dcc components/credit-hub/bank-v2 "app/(forge)/credit-hub/bank-v2" --ci; then
  echo "RESULT_PS_9_CARCASAS_2=PASS"
else
  echo "RESULT_PS_9_CARCASAS_2=FAIL"
  exit 1
fi
