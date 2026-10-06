import { readFileSync } from "fs";
import { join } from "path";

describe("registrar economia (D6): una sola via de venta", () => {
  const source = readFileSync(join(__dirname, "..", "registrar", "page.tsx"), "utf8");

  it("no ofrece un formulario de venta con moneda escrita a mano", () => {
    expect(source).not.toContain("sale_currency");
    expect(source).not.toContain("postVehicleSale");
  });

  it("remite al flujo de venta", () => {
    expect(source).toContain("/vender");
  });
});
