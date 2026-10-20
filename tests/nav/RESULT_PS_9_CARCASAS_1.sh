#!/usr/bin/env bash
# Prueba de hecho de PS_9_CARCASAS_1 (dashboard_ci). Última línea: RESULT_PS_9_CARCASAS_1=PASS | FAIL.
# Junto a sus tests, no en superloop/dashboard_ci.sh (compartido).
# PASS exige primero la prueba integrada (AppGate + layout de Credit Hub + BankChShell = UNA barra, la de ModuleShell,
# sin ForgeCreditHubAppShell ni ChAppShell); si falta el fichero o falla, FAIL sin mirar el resto.
set -u
cd "$(dirname "$0")/../.." || exit 1
INTEGRADA=tests/nav/ps-9-carcasas-1-integrado.test.tsx
if [ ! -f "$INTEGRADA" ] || ! npx jest "$INTEGRADA" --ci; then
  echo "RESULT_PS_9_CARCASAS_1=FAIL"
  exit 1
fi
if npx jest tests/nav tests/credit-hub/monetizacion tests/credit-hub/bank tests/credit-hub/shell tests/credit-hub/dealer tests/credit-hub/foundation --ci; then
  echo "RESULT_PS_9_CARCASAS_1=PASS"
else
  echo "RESULT_PS_9_CARCASAS_1=FAIL"
  exit 1
fi
