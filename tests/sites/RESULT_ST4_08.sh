#!/usr/bin/env bash
# Prueba de hecho de ST4-08: jest tests/sites + E2E con axe (e2e/sites). Ultima linea: RESULT_ST4_08=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
if npx jest tests/sites --ci --passWithNoTests=false && npx playwright test --config e2e/sites/playwright.config.ts; then
  echo "RESULT_ST4_08=PASS"
else
  echo "RESULT_ST4_08=FAIL"
  exit 1
fi
