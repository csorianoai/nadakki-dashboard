#!/usr/bin/env bash
# Prueba de hecho de DB-CODEX-15 (dashboard_ci). Ultima linea: RESULT_DB_CODEX_15=PASS | FAIL.
# (a) grep de console.log/info/debug en las rutas del expediente v1 = 0, (b) jest anti-console,
# (c) eslint: solo cuentan los mensajes de la regla no-console en esas rutas (los errores ajenos
# preexistentes, p. ej. rules-of-hooks en DisbursementPanel, los cubre `npm run lint`, no esta prueba), (d) jest de los tests existentes de bank.
set -u
eslint_no_console() {
  local out
  out=$(npx eslint "app/(forge)/credit-hub/bank" components/credit-hub/bank lib/credit-hub/hooks --ext .ts,.tsx --max-warnings=100000 -f json 2>/dev/null) || true
  printf '%s' "$out" | node -e '
    let d = ""; process.stdin.on("data", (c) => (d += c)).on("end", () => {
      let r; try { r = JSON.parse(d); } catch { console.error("eslint no produjo JSON"); process.exit(2); }
      const bad = r.flatMap((f) => f.messages.filter((m) => m.ruleId === "no-console").map((m) => f.filePath + ":" + m.line));
      if (bad.length) { console.error("no-console:\n" + bad.join("\n")); process.exit(1); }
      console.log("eslint no-console: 0 hallazgos en " + r.length + " ficheros");
    });'
}
cd "$(dirname "$0")/../.." || exit 1
hits=$(grep -rnE "console\.(log|info|debug)" "app/(forge)/credit-hub/bank" components/credit-hub/bank lib/credit-hub/hooks/useBank* 2>/dev/null | wc -l)
if [ "$hits" -eq 0 ] \
  && npx jest tests/credit-hub/no-console-bank.test.ts --ci --passWithNoTests=false \
  && eslint_no_console \
  && npx jest tests/credit-hub/bank --ci --passWithNoTests; then
  echo "RESULT_DB_CODEX_15=PASS"
else
  echo "RESULT_DB_CODEX_15=FAIL"
  exit 1
fi
