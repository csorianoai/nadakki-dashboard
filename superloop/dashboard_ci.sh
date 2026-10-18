#!/usr/bin/env bash
# Evidencia PS-6-DEMO-LEADS: datos fijos de /leads solo con badge DEMO.
set -euo pipefail
npx jest tests/app/leads/demo-badge.test.tsx
echo "RESULT_PS_6_DEMO_LEADS=PASS"
