#!/usr/bin/env bash
# Evidencia PS-6-DEMO-CONTENT-HUB: datos fijos de Content Hub llevan badge DEMO.
set -euo pipefail
npx jest tests/app/content/demo-badge.test.tsx
echo "RESULT_PS_6_DEMO_CONTENT_HUB=PASS"
