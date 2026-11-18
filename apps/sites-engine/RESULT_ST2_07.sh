#!/usr/bin/env bash
# Prueba de hecho ST2-07 (desde la raiz del repo): ejecuta el envoltorio y emite RESULT_ST2_07.
cd "$(dirname "$0")/../.." || exit 1
if npx playwright test --config apps/sites-engine/playwright.config.ts --grep ST2-07; then
  echo "RESULT_ST2_07=PASS"
else
  echo "RESULT_ST2_07=FAIL"
  exit 1
fi
