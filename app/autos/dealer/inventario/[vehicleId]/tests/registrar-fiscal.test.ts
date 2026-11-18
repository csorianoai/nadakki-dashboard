import { readFileSync } from "fs";
import { join } from "path";

describe("registrar (F4F-6): la compra fiscal no falla en silencio", () => {
  const source = readFileSync(join(__dirname, "..", "registrar", "page.tsx"), "utf8");
  it("dice que lo fiscal se activa despues en vez de ofrecer campos que el servidor ignora", () => {
    expect(source).toContain("Disponible cuando se active la contabilidad fiscal");
    expect(source).not.toContain("seller_tax_status");
  });
});
