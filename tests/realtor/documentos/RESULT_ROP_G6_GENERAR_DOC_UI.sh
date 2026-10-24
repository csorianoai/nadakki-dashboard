#!/usr/bin/env bash
# Prueba de hecho de ROP-G6-GENERAR-DOC-UI (dashboard_ci). Ultima linea: RESULT_ROP_G6_GENERAR_DOC_UI=PASS | FAIL.
# FAIL mientras falte alguna parte: cliente (1/3), controles (2/3) y 403 de descarga (3/3).
set -u
cd "$(dirname "$0")/../../.." || exit 1
for f in lib/realtor/documentos/generate.ts components/realtor/documentos/GenerateControls.tsx tests/realtor/documentos/descarga-403.test.tsx; do
  if [ ! -f "$f" ]; then
    echo "falta $f"
    echo "RESULT_ROP_G6_GENERAR_DOC_UI=FAIL"
    exit 1
  fi
done
if node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit -p . \
  && npx jest tests/realtor/documentos --ci; then
  echo "RESULT_ROP_G6_GENERAR_DOC_UI=PASS"
else
  echo "RESULT_ROP_G6_GENERAR_DOC_UI=FAIL"
  exit 1
fi
