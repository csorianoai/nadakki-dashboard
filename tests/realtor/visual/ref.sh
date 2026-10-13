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
# DL10A no tiene pantalla de alta: la referencia del asistente es "Mi oficina" (NAV[11]).
node "$root/tests/realtor/visual/ref-capture.js" "$html" "$out/alta.png" 11
echo "REF_OK=$out/demand_radar.png $out/alta.png"
