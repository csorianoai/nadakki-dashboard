/**
 * Contrato de la prueba de hecho RESULT_PS_10_REALTOR_QA_ACCESO.sh, que corre DENTRO de superloop/dashboard_ci.sh.
 * Sin tsc --noEmit (César, 2026-10-21; DECISION_EVIDENCIA_VERCEL=b_doble_prima, nadakki-ai-suite#2334 y #2383): en los
 * runners nadakki-ci (1 GiB) muere por memoria, y la comprobación de tipos la acredita el build de Vercel (next build,
 * sin ignoreBuildErrors), que dashboard_ci.sh exige con el deployment Preview de vercel[bot] del SHA exacto.
 */
import { readFileSync } from "fs";
import { join } from "path";

const script = readFileSync(join(__dirname, "RESULT_PS_10_REALTOR_QA_ACCESO.sh"), "utf8");
const codigo = script
  .split("\n")
  .filter((l) => !l.trimStart().startsWith("#"))
  .join("\n");

describe("RESULT_PS_10_REALTOR_QA_ACCESO.sh", () => {
  it("no corre tsc, typecheck ni next build", () => {
    expect(codigo).not.toMatch(/\btsc\b/);
    expect(codigo).not.toContain("typecheck");
    expect(codigo).not.toContain("npm run build");
    expect(codigo).not.toContain("next build");
  });

  it("corre jest de las cinco suites de acceso, sin exclusiones", () => {
    for (const suite of [
      "tests/realtor/acceso-fail-closed.test.tsx",
      "tests/realtor/alta-page-demo.test.tsx",
      "tests/realtor/AltaAsistente.test.tsx",
      "tests/realtor/menu.test.tsx",
      "tests/realtor/senales-demo-fail-closed.test.tsx",
    ]) {
      expect(codigo).toContain(suite);
    }
    expect(codigo).toMatch(/npx jest [^\n]*/);
    expect(codigo).toContain("--ci");
  });

  it("emite PASS y FAIL con el nombre de la prueba de hecho", () => {
    expect(codigo).toContain('echo "RESULT_PS_10_REALTOR_QA_ACCESO=PASS"');
    expect(codigo).toContain('echo "RESULT_PS_10_REALTOR_QA_ACCESO=FAIL"');
  });
});
