#!/usr/bin/env bash
# Evidencia dashboard_ci de DR-PANEL: typecheck + jest del módulo + build con backend inválido.
set -euo pipefail
npx tsc --noEmit
npx jest tests/realtor --ci
BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
# Next solo inlinea process.env.NEXT_PUBLIC_X literal y definido: con el flag "1" el chunk no puede leerlo del polyfill.
NEXT_PUBLIC_REALTOR_PANEL=1 BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
chunks=$(ls .next/static/chunks/app/realtor/demand-radar/page-*.js) || { echo "FAIL: no hay chunk de /realtor/demand-radar"; exit 1; }
grep -q 'NEXT_PUBLIC_REALTOR_PANEL:"1"' $chunks || { echo "FAIL: flag sin sustituir en el bundle"; exit 1; }
echo "RESULT_DR_PANEL=PASS"
