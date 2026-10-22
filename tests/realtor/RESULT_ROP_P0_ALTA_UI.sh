#!/usr/bin/env bash
# Prueba de hecho de ROP-P0-ALTA-UI (dashboard_ci). Ultima linea: RESULT_ROP_P0_ALTA_UI=PASS | FAIL.
# FAIL mientras la tarea no esta completa: exige la UI de verificacion (PARTE 2/2) ademas de la cadena (PARTE 1/2).
set -u
cd "$(dirname "$0")/../.." || exit 1
for f in components/realtor/LicenciaVerificar.tsx tests/realtor/alta-licencia-ui.test.tsx; do
  if [ ! -f "$f" ]; then
    echo "falta $f (PARTE 2/2 pendiente)"
    echo "RESULT_ROP_P0_ALTA_UI=FAIL"
    exit 1
  fi
done
if npx tsc --noEmit -p . \
  && npx jest tests/realtor/alta-cadena.test.ts tests/realtor/alta.test.ts tests/realtor/AltaAsistente.test.tsx tests/realtor/alta-licencia-ui.test.tsx --ci; then
  echo "RESULT_ROP_P0_ALTA_UI=PASS"
else
  echo "RESULT_ROP_P0_ALTA_UI=FAIL"
  exit 1
fi
