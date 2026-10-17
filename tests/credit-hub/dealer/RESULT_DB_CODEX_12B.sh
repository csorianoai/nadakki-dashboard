#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-12B (dashboard_ci). Ultima linea: RESULT_DB_CODEX_12B=PASS | FAIL.
# Evidencia completa: superloop/dashboard_ci.sh (typecheck, jest relacionados, build). Aqui, el gate del borrador de servidor.
set -u
cd "$(dirname "$0")/../../.." || exit 1
export NEXT_PUBLIC_BACKEND_URL="${NEXT_PUBLIC_BACKEND_URL:-http://localhost:8000}"
export NODE_OPTIONS="--max-old-space-size=4096 ${NODE_OPTIONS:-}"
if npm run typecheck && npx jest --ci tests/credit-hub/dealer/wizard/draft-server-wizard.test.tsx \
  tests/credit-hub/dealer/wizard/draft-logout-delete.test.tsx tests/credit-hub/dealer/wizard/draft-pointer-storage.test.ts \
  tests/credit-hub/dealer/wizard/f9-persistence.test.ts tests/credit-hub/dealer/wizard/submit-order-provider.test.tsx \
  tests/credit-hub/dealer/wizard/wizard-submit-failed.test.tsx; then
  echo "RESULT_DB_CODEX_12B=PASS"
else
  echo "RESULT_DB_CODEX_12B=FAIL"
  exit 1
fi
