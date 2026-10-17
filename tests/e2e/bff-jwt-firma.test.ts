/** @jest-environment node */
import { conFirmaAlterada } from "../../e2e/api/jwt-firma";

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJxYSJ9.firmaDePrueba";

describe("e2e/api/jwt-firma conFirmaAlterada", () => {
  it("conserva cabecera y payload y cambia la firma", () => {
    const alterado = conFirmaAlterada(JWT);
    const [h, p, s] = alterado.split(".");
    expect(h).toBe("eyJhbGciOiJIUzI1NiJ9");
    expect(p).toBe("eyJzdWIiOiJxYSJ9");
    expect(s).not.toBe("firmaDePrueba");
    expect(s).toHaveLength("firmaDePrueba".length);
    expect(alterado).not.toBe(JWT);
  });

  it("cambia el último carácter aunque sea A (usa B)", () => {
    expect(conFirmaAlterada("a.b.firmaA")).toBe("a.b.firmaB");
  });

  it("cambia el último carácter cuando no es A (usa A)", () => {
    expect(conFirmaAlterada("a.b.firma1")).toBe("a.b.firmaA");
  });

  it("no lanza con una firma vacía", () => {
    expect(conFirmaAlterada("a.b.")).toBe("a.b.A");
  });
});
