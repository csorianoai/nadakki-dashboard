#!/usr/bin/env bash
# Prueba de hecho de ROP-P3-ABRIR-OPERACION-CLIENTES (dashboard_ci). Ultima linea: RESULT_ROP_P3_ABRIR_OPERACION_CLIENTES=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/realtor/clientes/abrir-operacion.test.tsx --ci --passWithNoTests=false && grep -q "contact-abrir-operacion" components/realtor/clientes/ClientesPanel.tsx; then
  echo "RESULT_ROP_P3_ABRIR_OPERACION_CLIENTES=PASS"
else
  echo "RESULT_ROP_P3_ABRIR_OPERACION_CLIENTES=FAIL"
  exit 1
fi
