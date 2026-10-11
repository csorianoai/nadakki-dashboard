#!/usr/bin/env bash
# Evidencia dashboard_ci de DR-PANEL: typecheck + jest del módulo + build con backend inválido.
set -euo pipefail
npx tsc --noEmit
npx jest tests/realtor --ci
BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
# Next solo inlinea process.env.NEXT_PUBLIC_X literal y definido: con el flag "on" el chunk no puede leerlo del polyfill.
NEXT_PUBLIC_REALTOR_DEMAND_RADAR=on BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
if grep -q "env\.NEXT_PUBLIC_REALTOR_DEMAND_RADAR" .next/static/chunks/app/realtor/demand-radar/page-*.js; then
  echo "FAIL: NEXT_PUBLIC_REALTOR_DEMAND_RADAR sin sustituir en el bundle del cliente"; exit 1
fi
echo "RESULT_DR_PANEL=PASS"
