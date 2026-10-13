#!/usr/bin/env bash
# Evidencia dashboard_ci de G2-WEB-AGENTE: typecheck + jest del módulo + build con backend inválido.
set -euo pipefail
npx tsc --noEmit
npx jest tests/realtor --ci
BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
echo "RESULT_G2_WEB=PASS"
