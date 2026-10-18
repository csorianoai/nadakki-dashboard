#!/bin/sh
# Prueba de hecho PS-15-BFF-BINARIOS: el proxy /api/v1 conserva los bytes de una descarga.
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/api; then
  echo "RESULT_PS_15_BFF_BINARIOS=PASS"
else
  echo "RESULT_PS_15_BFF_BINARIOS=FAIL"
fi
