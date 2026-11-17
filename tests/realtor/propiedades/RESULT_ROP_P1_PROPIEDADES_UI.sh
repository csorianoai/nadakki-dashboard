#!/usr/bin/env bash
# Prueba de hecho de ROP-P1-PROPIEDADES-UI (dashboard_ci). Ultima linea: RESULT_ROP_P1_PROPIEDADES_UI=PASS | FAIL.
# Da FAIL hasta que existen el formulario (alta/edicion) y sus pruebas integradas con el acceso real.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if [ ! -f components/realtor/propiedades/PropiedadForm.tsx ] || [ ! -f tests/realtor/propiedades/formulario.test.tsx ]; then
  echo "RESULT_ROP_P1_PROPIEDADES_UI=FAIL"
  exit 1
fi
if npx jest tests/realtor/propiedades --ci --passWithNoTests=false; then
  echo "RESULT_ROP_P1_PROPIEDADES_UI=PASS"
else
  echo "RESULT_ROP_P1_PROPIEDADES_UI=FAIL"
  exit 1
fi
