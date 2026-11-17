#!/usr/bin/env bash
# Prueba de hecho de ROP-G5-MIDIA-UI (dashboard_ci). Ultima linea: RESULT_ROP_G5_MIDIA_UI=PASS | FAIL.
# Da FAIL si falta la seccion de visitas del dia (visitas.test.tsx) o si algun test de Mi dia falla.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if [ -f tests/realtor/mi-dia/visitas.test.tsx ] && npm run typecheck && npx jest tests/realtor/mi-dia --ci --passWithNoTests=false; then
  echo "RESULT_ROP_G5_MIDIA_UI=PASS"
else
  echo "RESULT_ROP_G5_MIDIA_UI=FAIL"
  exit 1
fi
