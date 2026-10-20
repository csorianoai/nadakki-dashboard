#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_3 (evidence.prueba_de_hecho). Última línea: RESULT_PS_9_CARCASAS_3=PASS | FAIL.
# PASS exige primero las rutas sin módulo con UNA barra, la puerta del dealer con DealerSuiteGate y ProtectedRoute REALES
# y la retirada con grep = 0; si falta un fichero o falla, FAIL sin mirar el resto.
set -u
cd "$(dirname "$0")/../.." || exit 1
PRUEBAS=(
  tests/nav/ps-9-carcasas-3-sin-modulo.test.tsx
  tests/nav/ps-9-carcasas-3-puerta-dealer.test.tsx
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
