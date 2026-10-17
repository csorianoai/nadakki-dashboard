/**
 * Contrato de la prueba de hecho RESULT_DB_CODEX_2.sh: corre typecheck, jest de tests/credit-hub/dealer y api
 * y next build, y su última línea es RESULT_DB_CODEX_2=PASS o FAIL.
 */
import { readFileSync } from "fs";
import { join } from "path";

const script = readFileSync(join(__dirname, "RESULT_DB_CODEX_2.sh"), "utf8");

describe("RESULT_DB_CODEX_2.sh", () => {
  it("ejecuta typecheck, jest de dealer y api, y build", () => {
    expect(script).toContain("npm run typecheck");
    expect(script).toContain("jest tests/credit-hub/dealer tests/credit-hub/api");
    expect(script).toContain("npm run build");
  });

  it("fija el heap de node en 4 GB", () => {
    expect(script).toContain("--max-old-space-size=4096");
  });

  it("emite PASS y FAIL con el nombre de la prueba de hecho", () => {
    expect(script).toContain('echo "RESULT_DB_CODEX_2=PASS"');
    expect(script).toContain('echo "RESULT_DB_CODEX_2=FAIL"');
  });
});
