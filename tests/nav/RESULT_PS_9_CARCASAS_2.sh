#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_2 (dashboard_ci). Última línea: RESULT_PS_9_CARCASAS_2=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh (compartido).
# PASS exige primero las pruebas integradas (AppGate + layouts REALES del Dealer OS, el Centro Operativo, la Contabilidad
# del dealer y bank-v2 = UNA barra, la de ModuleShell, sin el menú ni la barra de DealerShell o DccShell); si falta un
# fichero o falla, FAIL sin mirar el resto.
# DECISION_CESAR 20-oct 10:46 (#2067): incluye YA la prueba (d) de la retirada (ps-9-carcasas-2-retirada.test.ts, la trae
# la PARTE 7/7): hasta que entre, este RESULT da FAIL; solo puede dar PASS con las 7 partes. Nada de PASS parcial.
set -u
cd "$(dirname "$0")/../.." || exit 1
INTEGRADAS=(
  tests/nav/ps-9-carcasas-2-capacidades.test.tsx
  tests/nav/ps-9-carcasas-2-dealer-dentro.test.tsx
  tests/nav/ps-9-carcasas-2-integrado.test.tsx
  tests/nav/ps-9-carcasas-2-banco.test.tsx
  tests/nav/ps-9-carcasas-2-banco-shell.test.tsx
  tests/nav/ps-9-carcasas-2-contable.test.tsx
  tests/nav/ps-9-carcasas-2-dealer-sin-bucle.test.tsx
  tests/nav/ps-9-carcasas-2-retirada.test.ts
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
if npx jest tests/nav tests/dealer tests/components/dealer-management components/dcc components/credit-hub/bank-v2 'app/\(forge\)/credit-hub/bank-v2' --ci; then
  echo "RESULT_PS_9_CARCASAS_2=PASS"
else
  echo "RESULT_PS_9_CARCASAS_2=FAIL"
  exit 1
fi
