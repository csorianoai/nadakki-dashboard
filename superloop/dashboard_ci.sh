#!/usr/bin/env bash
# Evidencia PS-5-CARGA-PROYECTOS: panel /proyectos sin carga infinita ni error crudo.
set -euo pipefail
npx jest tests/app/proyectos/panel-carga.test.tsx
echo "RESULT_PS_5_CARGA_PROYECTOS=PASS"
