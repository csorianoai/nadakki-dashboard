#!/usr/bin/env bash
# Prueba de hecho ST2-04 (desde la raiz del repo): ejecuta el envoltorio y emite RESULT_ST2_04.
cd "$(dirname "$0")/../.." || exit 1
if npx playwright test --config apps/sites-engine/playwright.config.ts --grep ST2-04; then
  echo "RESULT_ST2_04=PASS"
else
  echo "RESULT_ST2_04=FAIL"
  exit 1
fi
