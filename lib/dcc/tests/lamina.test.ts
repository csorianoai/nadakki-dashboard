import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { laminaHtml } from "@/lib/dcc/lamina";

const RUTA = join(__dirname, "..", "..", "..", "docs", "design", "DCC_TOKENS_LAMINA.html");

describe("lamina de tokens", () => {
  it("docs/design/DCC_TOKENS_LAMINA.html es exactamente la salida de laminaHtml()", () => {
    // Regenerar: DCC_ESCRIBIR_LAMINA=1 npx jest lib/dcc/tests/lamina.test.ts
    if (process.env.DCC_ESCRIBIR_LAMINA === "1") writeFileSync(RUTA, laminaHtml());
    expect(readFileSync(RUTA, "utf8")).toBe(laminaHtml());
  });
});
