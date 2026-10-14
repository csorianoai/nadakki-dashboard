#!/usr/bin/env bash
# Regenera docs/design/realtor/DL10A/ref/*.png desde el ZIP oficial del diseño DL10A (unzip + Playwright sobre file://).
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
zip="$root/docs/design/realtor/DL10A/Nadakki_Realtor_OS_DL10A_FINAL_GATE.zip"
[ -f "$zip" ] || zip="${DL10A_ZIP:?no hay ZIP en docs/design; indica DL10A_ZIP=ruta}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
unzip -q "$zip" -d "$work"
html="$(find "$work" -name 'Nadakki_Realtor_OS_DL10A_autonomo.html' | head -1)"
[ -n "$html" ] || { echo "FAIL: el ZIP no trae el HTML autónomo"; exit 1; }
out="$root/docs/design/realtor/DL10A/ref"
mkdir -p "$out"
# Centro 5 del prototipo = Demand Radar (NAV[5]); el script vive fuera del directorio extraído.
node "$root/tests/realtor/visual/ref-capture.js" "$html" "$out/demand_radar.png" 5
# Centros del prototipo (índice NAV): 0 mi-dia, 1 clientes, 2 propietarios, 3 propiedades, 4 marketing-ai, 6 operaciones, 7 documentos.
for pair in 0:mi_dia 1:clientes 2:propietarios 3:propiedades 4:marketing_ai 6:operaciones 7:documentos; do
  node "$root/tests/realtor/visual/ref-capture.js" "$html" "$out/${pair#*:}.png" "${pair%%:*}"
done
# DL10A no tiene pantalla de alta ni de Career Director: su referencia es "Mi oficina" (NAV[11]).
node "$root/tests/realtor/visual/ref-capture.js" "$html" "$out/alta.png" 11
node "$root/tests/realtor/visual/ref-capture.js" "$html" "$out/career_director.png" 11
echo "REF_OK=$out"
