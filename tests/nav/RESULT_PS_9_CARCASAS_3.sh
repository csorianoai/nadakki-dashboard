#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_3 (dashboard_ci; la tarjeta la declara en evidence.prueba_de_hecho). Última línea:
# RESULT_PS_9_CARCASAS_3=PASS | FAIL. Exige TODAS las integradas de la serie y la retirada (d), que trae la PARTE 5/5:
# hasta que entre, da FAIL (César 20-oct 12:10, #2067: nada de PASS parcial). Si falta un fichero o falla, FAIL sin
# mirar el resto. Las integradas montan AppGate con los layouts REALES y la DealerSuiteGate REAL.
set -u
cd "$(dirname "$0")/../.." || exit 1
INTEGRADAS=(
  tests/nav/ps-9-carcasas-3-contable.test.tsx
  tests/nav/ps-9-carcasas-3-suite.test.tsx
  tests/nav/ps-9-carcasas-3-credito.test.tsx
  tests/nav/ps-9-carcasas-3-trasladadas.test.tsx
  tests/nav/ps-9-carcasas-3-retirada.test.ts
)
for f in "${INTEGRADAS[@]}"; do
  if [ ! -f "$f" ]; then
    echo "falta $f"
    echo "RESULT_PS_9_CARCASAS_3=FAIL"
    exit 1
  fi
done
if ! npx jest "${INTEGRADAS[@]}" --ci; then
  echo "RESULT_PS_9_CARCASAS_3=FAIL"
  exit 1
fi
if npx jest tests/nav tests/dealer tests/auth tests/components/dealer-management tests/credit-hub/polish 'app/\(forge\)/credit-hub' --ci; then
  echo "RESULT_PS_9_CARCASAS_3=PASS"
else
  echo "RESULT_PS_9_CARCASAS_3=FAIL"
  exit 1
fi
