#!/usr/bin/env bash
# Evidencia dashboard_ci de DR-PANEL: typecheck + jest del módulo + build con backend inválido.
set -euo pipefail
npx tsc --noEmit
npx jest tests/realtor --ci
BACKEND_URL="http://backend.invalid" NEXT_PUBLIC_API_URL="http://backend.invalid" npm run build
echo "RESULT_DR_PANEL=PASS"
