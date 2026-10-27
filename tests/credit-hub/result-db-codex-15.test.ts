/**
 * Contrato de la prueba de hecho RESULT_DB_CODEX_15.sh: grep anti-console, jest no-console-bank,
 * eslint sobre bank y jest de tests/credit-hub/bank; su última línea es RESULT_DB_CODEX_15=PASS o FAIL.
 */
import { readFileSync } from "fs";
import { join } from "path";

const script = readFileSync(join(__dirname, "RESULT_DB_CODEX_15.sh"), "utf8");

describe("RESULT_DB_CODEX_15.sh", () => {
  it("comprueba console.log/info/debug en las rutas del expediente v1", () => {
    expect(script).toContain("console\\.(log|info|debug)");
    expect(script).toContain("components/credit-hub/bank");
    expect(script).toContain("lib/credit-hub/hooks/useBank*");
  });

  it("corre el test anti-console, eslint y los tests de bank", () => {
    expect(script).toContain("tests/credit-hub/no-console-bank.test.ts");
    expect(script).toContain("npx eslint");
    expect(script).toContain("jest tests/credit-hub/bank");
  });

  it("emite PASS y FAIL con el nombre de la prueba de hecho", () => {
    expect(script).toContain('echo "RESULT_DB_CODEX_15=PASS"');
    expect(script).toContain('echo "RESULT_DB_CODEX_15=FAIL"');
  });
});
