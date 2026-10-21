#!/usr/bin/env bash
# Prueba de hecho de ROP-P1-CONTACTOS-UI (dashboard_ci). Ultima linea: RESULT_ROP_P1_CONTACTOS_UI=PASS | FAIL.
# Integrados de la pantalla con el cliente real del API (apiFetch sin simular) y los de la ficha.
set -u
cd "$(dirname "$0")/../../.." || exit 1
if npx jest tests/realtor/clientes --ci --passWithNoTests=false && test -f components/realtor/clientes/ContactForm.tsx; then
  echo "RESULT_ROP_P1_CONTACTOS_UI=PASS"
else
  echo "RESULT_ROP_P1_CONTACTOS_UI=FAIL"
  exit 1
fi
