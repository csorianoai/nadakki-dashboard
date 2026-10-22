#!/usr/bin/env bash
# Prueba de hecho DB-CODEX-20: guard sin console.log/info/debug en el Credit Hub.
set -uo pipefail
cd "$(dirname "$0")/../.."
if node scripts/ci/sin-console-credit-hub.mjs && npx jest scripts/ci/sin-console-credit-hub.test.ts; then
  echo "RESULT_DB_CODEX_20=PASS"
else
  echo "RESULT_DB_CODEX_20=FAIL"
  exit 1
fi
