#!/usr/bin/env bash
# Prueba de hecho de PI-2 PI-VISIBLE, entrada del menú (DASH-REALTOR). Última línea: RESULT_PI2_MENU=PASS | FAIL.
# Sin `npm run typecheck` (César, 2026-10-21; DECISION_EVIDENCIA_VERCEL=b_doble_prima): tsc --noEmit muere por memoria
# en nadakki-ci (1 GiB); los tipos los acredita el build de Vercel, que dashboard_ci.sh exige con el deployment Preview
# del SHA. La guarda sin-console-credit-hub la corre dashboard_ci.sh.
set -u
cd "$(dirname "$0")/../.." || exit 1
if NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/realtor tests/nav/manifiesto-paginas.test.ts tests/nav/migas-realtor.test.ts --ci; then
  echo "RESULT_PI2_MENU=PASS"
else
  echo "RESULT_PI2_MENU=FAIL"
  exit 1
fi
