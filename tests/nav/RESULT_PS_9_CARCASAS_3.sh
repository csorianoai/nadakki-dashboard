#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_3 (dashboard_ci). Última línea: RESULT_PS_9_CARCASAS_3=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh (compartido).
# PASS exige primero las pruebas de la tarjeta (rutas sin módulo sobre ModuleShell con UNA barra; retirada de
# ForgeAppShell y GlobalForgeAppShell con grep = 0); si falta un fichero o falla, FAIL sin mirar el resto.
set -u
cd "$(dirname "$0")/../.." || exit 1
PRUEBAS=(
  tests/nav/ps-9-carcasas-3-sin-modulo.test.tsx
  tests/nav/ps-9-carcasas-3-retirada.test.ts
)
for f in "${PRUEBAS[@]}"; do
  if [ ! -f "$f" ]; then
    echo "falta $f"
    echo "RESULT_PS_9_CARCASAS_3=FAIL"
    exit 1
  fi
done
if ! npx jest "${PRUEBAS[@]}" --ci; then
  echo "RESULT_PS_9_CARCASAS_3=FAIL"
  exit 1
fi
if npx jest tests/nav tests/dealer tests/auth/realtor-app-gate.test.tsx tests/auth/logout-dealer-app-gate.test.tsx tests/credit-hub/polish tests/components/dealer-management --ci; then
  echo "RESULT_PS_9_CARCASAS_3=PASS"
else
  echo "RESULT_PS_9_CARCASAS_3=FAIL"
  exit 1
fi
