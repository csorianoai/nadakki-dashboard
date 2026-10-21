/**
 * Contrato de la prueba de hecho RESULT_PI2_MENU.sh, que corre DENTRO de superloop/dashboard_ci.sh.
 * Sin `npm run typecheck` (César, 2026-10-21; DECISION_EVIDENCIA_VERCEL=b_doble_prima, nadakki-ai-suite#2334 y
 * #2383): tsc --noEmit muere por memoria en nadakki-ci (1 GiB), y la comprobación de tipos la acredita el build de
 * Vercel (next build, sin ignoreBuildErrors), que dashboard_ci.sh exige con el deployment Preview de vercel[bot] del
 * SHA exacto. La guarda sin-console-credit-hub que también hacía typecheck la corre dashboard_ci.sh.
 */
import { readFileSync } from "fs";
import { join } from "path";

const script = readFileSync(join(__dirname, "RESULT_PI2_MENU.sh"), "utf8");
const codigo = script
  .split("\n")
  .filter((l) => !l.trimStart().startsWith("#"))
  .join("\n");

describe("RESULT_PI2_MENU.sh", () => {
  it("no corre typecheck, tsc ni next build", () => {
    expect(codigo).not.toContain("typecheck");
    expect(codigo).not.toMatch(/\btsc\b/);
    expect(codigo).not.toContain("npm run build");
    expect(codigo).not.toContain("next build");
  });

  it("corre jest de tests/realtor, el manifiesto y las migas", () => {
    expect(codigo).toMatch(/npx jest [^\n]*tests\/realtor /);
    expect(codigo).toContain("tests/nav/manifiesto-paginas.test.ts");
    expect(codigo).toContain("tests/nav/migas-realtor.test.ts");
    expect(codigo).toContain("--ci");
  });

  it("emite PASS y FAIL con el nombre de la prueba de hecho", () => {
    expect(codigo).toContain('echo "RESULT_PI2_MENU=PASS"');
    expect(codigo).toContain('echo "RESULT_PI2_MENU=FAIL"');
  });
});
