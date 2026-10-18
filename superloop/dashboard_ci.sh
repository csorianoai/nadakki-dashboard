#!/usr/bin/env bash
# Evidencia PS-6-DEMO-NOTIFICACIONES: /notifications marca sus datos fijos con badge DEMO.
set -euo pipefail
npx jest tests/app/notifications/demo-badge.test.tsx
echo "RESULT_PS_6_DEMO_NOTIFICACIONES=PASS"
