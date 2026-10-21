#!/usr/bin/env bash
# Prueba de hecho de ROP-P3-OPERACION-UI (dashboard_ci). Última línea: RESULT_ROP_P3_OPERACION_UI=PASS | FAIL.
# Da FAIL hasta que la tarea está completa: la pantalla de operaciones Y las entradas desde propiedad y prospecto.
set -u
cd "$(dirname "$0")/../../.." || exit 1
fail() { echo "FALTA: $1"; echo "RESULT_ROP_P3_OPERACION_UI=FAIL"; exit 1; }
grep -q "realtor/operaciones" components/realtor/propiedades/PropiedadesPanel.tsx || fail "enlace «Abrir operación» en la propiedad"
grep -q "realtor/operaciones" components/realtor/clientes/ClientesPanel.tsx || fail "enlace «Abrir operación» en el prospecto"
if npx jest tests/realtor/operaciones --ci --passWithNoTests=false; then
  echo "RESULT_ROP_P3_OPERACION_UI=PASS"
else
  echo "RESULT_ROP_P3_OPERACION_UI=FAIL"
  exit 1
fi
