#!/usr/bin/env bash
# Prueba de hecho de ROP-G4-ASIGNACION-PROPIEDADES-UI (dashboard_ci). Ultima linea: RESULT_ROP_G4_ASIGNACION_PROPIEDADES_UI=PASS | FAIL.
# Da FAIL hasta que existen la capa (asignaciones.test.ts) y la seccion de la ficha (asignaciones-ficha.test.tsx, PARTE 2/2) y todo pasa.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if [ -f tests/realtor/propiedades/asignaciones.test.ts ] && [ -f tests/realtor/propiedades/asignaciones-ficha.test.tsx ] \
  && npm run typecheck && npx jest tests/realtor/propiedades --ci --passWithNoTests=false; then
  echo "RESULT_ROP_G4_ASIGNACION_PROPIEDADES_UI=PASS"
else
  echo "RESULT_ROP_G4_ASIGNACION_PROPIEDADES_UI=FAIL"
  exit 1
fi
