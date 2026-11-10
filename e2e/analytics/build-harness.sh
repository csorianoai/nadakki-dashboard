#!/usr/bin/env bash
# Genera el harness estatico del kit (HTML + CSS compilado con la config real de Tailwind y los tokens forge).
# Uso:  OUT=/tmp/kit-harness bash e2e/analytics/build-harness.sh
set -euo pipefail
OUT="${OUT:-/tmp/kit-harness}"
mkdir -p "$OUT"
ANALYTICS_HARNESS_OUT="$OUT" npx jest tests/analytics/harness --silent
{ cat styles/forge-tokens-v2.css; printf '\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'; } > "$OUT/in.css"
npx tailwindcss -c tailwind.config.js -i "$OUT/in.css" -o "$OUT/kit.css" --content "$OUT/kit.html,$OUT/graficos-1440x900.html,$OUT/graficos-390x844.html,$OUT/graficos-320x568.html"
echo "HARNESS_OK $OUT"
