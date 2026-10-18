#!/usr/bin/env bash
# Evidencia PS-11-MODULOS-OPS-B: módulos operativos por rol, pantalla llana sin módulos y aviso legible.
set -euo pipefail
npx jest tests/nav tests/app/admin-solo-superadmin.test.tsx tests/app/suite-solo-plataforma.test.tsx lib/dcc
echo "RESULT_PS_11_MODULOS_OPS_B=PASS"
