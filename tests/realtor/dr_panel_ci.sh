#!/usr/bin/env bash
# Evidencia dashboard_ci de DR-PANEL: typecheck + jest del módulo + build con backend inválido.
set -euo pipefail
npx tsc --noEmit
npx jest tests/realtor --ci
BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
# Next solo inlinea process.env.NEXT_PUBLIC_X literal y definido: con el flag "1" el chunk no puede leerlo del polyfill.
NEXT_PUBLIC_REALTOR_PANEL=1 BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
# Los chunks que carga la página según su manifiesto: el interruptor puede vivir en un chunk compartido con
# /realtor (useRealtorAccess), no solo en el chunk propio de la página.
manifest=.next/server/app/realtor/demand-radar/page_client-reference-manifest.js
[ -f "$manifest" ] || { echo "FAIL: no hay manifiesto de /realtor/demand-radar"; exit 1; }
chunks=$(grep -o 'static/chunks/[A-Za-z0-9/_.-]*\.js' "$manifest" | sort -u | sed 's|^|.next/|')
[ -n "$chunks" ] || { echo "FAIL: el manifiesto no lista chunks"; exit 1; }
grep -q 'NEXT_PUBLIC_REALTOR_PANEL:"1"' $chunks || { echo "FAIL: flag sin sustituir en el bundle"; exit 1; }
echo "RESULT_DR_PANEL=PASS"
