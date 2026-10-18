#!/usr/bin/env bash
# Evidencia PS-6-DEMO-SIC-REPORTES: /sic/reportes sin datos de demostración disfrazados.
set -euo pipefail
npx jest tests/app/sic/reportes-demo.test.tsx
echo "RESULT_PS_6_DEMO_SIC_REPORTES=PASS"
