#!/usr/bin/env bash
# Prueba de hecho de PS-3-USUARIOS-ROLES-B (dashboard_ci). Ultima linea: RESULT_PS_3_USUARIOS_ROLES_B=PASS | FAIL.
# typecheck, jest de tests/admin/usuarios y next build, los tres con heap de 4 GB (el de node por defecto aborta el build en CI).
set -u
cd "$(dirname "$0")/../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest tests/admin/usuarios --ci --passWithNoTests=false && npm run build; then
  echo "RESULT_PS_3_USUARIOS_ROLES_B=PASS"
else
  echo "RESULT_PS_3_USUARIOS_ROLES_B=FAIL"
  exit 1
fi
