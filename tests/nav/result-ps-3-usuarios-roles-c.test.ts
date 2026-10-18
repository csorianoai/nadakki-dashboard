/**
 * Contrato de la prueba de hecho RESULT_PS_3_USUARIOS_ROLES_C.sh: corre typecheck, jest de tests/nav y next build,
 * y su última línea es RESULT_PS_3_USUARIOS_ROLES_C=PASS o FAIL.
 */
import { readFileSync } from "fs";
import { join } from "path";

const script = readFileSync(join(__dirname, "RESULT_PS_3_USUARIOS_ROLES_C.sh"), "utf8");

describe("RESULT_PS_3_USUARIOS_ROLES_C.sh", () => {
  it("ejecuta typecheck, jest de tests/nav y build", () => {
    expect(script).toContain("npm run typecheck");
    expect(script).toContain("jest tests/nav");
    expect(script).toContain("npm run build");
  });

  it("fija el heap de node en 4 GB", () => {
    expect(script).toContain("--max-old-space-size=4096");
  });

  it("emite PASS y FAIL con el nombre de la prueba de hecho", () => {
    expect(script).toContain('echo "RESULT_PS_3_USUARIOS_ROLES_C=PASS"');
    expect(script).toContain('echo "RESULT_PS_3_USUARIOS_ROLES_C=FAIL"');
  });
});
