#!/usr/bin/env bash
# Prueba de hecho ST2-03 (desde la raiz del repo): ejecuta el envoltorio y emite RESULT_ST2_03.
cd "$(dirname "$0")/../.." || exit 1
if npx playwright test --config apps/sites-engine/playwright.config.ts --grep ST2-03; then
  echo "RESULT_ST2_03=PASS"
else
  echo "RESULT_ST2_03=FAIL"
  exit 1
fi
