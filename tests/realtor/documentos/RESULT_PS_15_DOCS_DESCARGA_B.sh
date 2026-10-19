#!/usr/bin/env bash
# Prueba de hecho de PS-15-DOCS-DESCARGA-B (dashboard_ci). Última línea: RESULT_PS_15_DOCS_DESCARGA_B=PASS | FAIL.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/realtor/documentos --ci; then
  echo "RESULT_PS_15_DOCS_DESCARGA_B=PASS"
else
  echo "RESULT_PS_15_DOCS_DESCARGA_B=FAIL"
  exit 1
fi
