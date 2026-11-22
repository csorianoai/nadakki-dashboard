#!/usr/bin/env bash
# Prueba de hecho ST2-01 (desde la raiz del repo): ejecuta el envoltorio y emite RESULT_ST2_01.
cd "$(dirname "$0")/../.." || exit 1
if npx playwright test --config apps/sites-engine/playwright.config.ts --grep ST2-01; then
  echo "RESULT_ST2_01=PASS"
else
  echo "RESULT_ST2_01=FAIL"
  exit 1
fi
