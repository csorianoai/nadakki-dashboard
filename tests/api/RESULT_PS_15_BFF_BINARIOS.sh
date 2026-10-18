#!/usr/bin/env bash
# Prueba de hecho de BFF-BINARIOS (desbloquea PS-15-DOCS-DESCARGA-B). Ultima linea: RESULT_PS_15_BFF_BINARIOS=PASS | FAIL.
# jest de tests/api/bff-binarios.test.ts: el proxy /api/v1 devuelve binarios byte a byte y conserva Content-Disposition.
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
if npx jest tests/api/bff-binarios.test.ts --ci --passWithNoTests=false; then
  echo "RESULT_PS_15_BFF_BINARIOS=PASS"
else
  echo "RESULT_PS_15_BFF_BINARIOS=FAIL"
  exit 1
fi
