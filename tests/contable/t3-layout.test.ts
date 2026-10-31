/** MF3-T3 (parte 2/3): el layout de Contabilidad aplica los tokens --forge-* (ver t3-contraste.test.ts). */
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.resolve(__dirname, "../../app/contable/layout.tsx"), "utf8");

describe("MF3-T3 contable: layout", () => {
  test("aplica TOKENS_CONTABLE al contenedor", () => {
    expect(src).toMatch(/style=\{TOKENS_CONTABLE\}/);
  });
  test("monta ContableTokensPortal para el portal del Modal", () => {
    expect(src).toMatch(/<ContableTokensPortal\s*\/>/);
  });
});
