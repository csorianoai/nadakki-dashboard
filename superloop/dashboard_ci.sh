#!/usr/bin/env bash
# Evidencia DB-CODEX-26B: guard de español neutro + grid con branding es-DO.
set -euo pipefail
npx jest tests/ci/espanol-neutro-guard.test.ts tests/components/dealer-management/DealerModuleGrid.test.tsx
echo "RESULT_DB_CODEX_26B=PASS"
