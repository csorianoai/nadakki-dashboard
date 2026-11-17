#!/usr/bin/env bash
# Prueba de hecho de ROP-P3-ABRIR-OPERACION-PROPIEDADES (dashboard_ci). Ultima linea: RESULT_ROP_P3_ABRIR_OPERACION_PROPIEDADES=PASS | FAIL.
# Da FAIL hasta que el enlace «Abrir operación» existe en la ficha y su test pasa.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if [ ! -f tests/realtor/propiedades/abrir-operacion.test.tsx ]; then
  echo "RESULT_ROP_P3_ABRIR_OPERACION_PROPIEDADES=FAIL"
  exit 1
fi
if npx jest tests/realtor/propiedades/abrir-operacion.test.tsx --ci --passWithNoTests=false; then
  echo "RESULT_ROP_P3_ABRIR_OPERACION_PROPIEDADES=PASS"
else
  echo "RESULT_ROP_P3_ABRIR_OPERACION_PROPIEDADES=FAIL"
  exit 1
fi
