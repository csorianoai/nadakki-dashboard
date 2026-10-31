/**
 * F2 — contrato del spec e2e `e2e/mapaal-f3/f2-analisis.spec.ts`: debe correr sin credenciales ni red externa
 * (todo el backend interceptado con page.route y cualquier peticion a nadakki.com hace fallar el test).
 * @jest-environment node
 */
import { readFileSync } from "fs";
import { join } from "path";

const spec = readFileSync(join(process.cwd(), "e2e/mapaal-f3/f2-analisis.spec.ts"), "utf8");

describe("e2e/mapaal-f3/f2-analisis.spec.ts", () => {
  it("no depende de credenciales reales ni se salta en CI", () => {
    expect(spec).not.toMatch(/process\.env\.(QA_USER|QA_PASSWORD|QA_TOTP_SECRET)/);
    expect(spec).not.toMatch(/test\.skip\(/);
  });

  it("intercepta el backend con page.route y aborta lo externo", () => {
    expect(spec).toMatch(/page\.route\(/);
    expect(spec).toMatch(/route\.abort\(\)/);
    expect(spec).toMatch(/nadakki\\\.com/);
  });

  it("falla si hubo peticiones a nadakki.com y emite RESULT_MF3_F2", () => {
    expect(spec).toMatch(/expect\(externas,[^\n]*\)\.toEqual\(\[\]\)/);
    expect(spec).toContain('console.log("RESULT_MF3_F2=PASS")');
  });
});
