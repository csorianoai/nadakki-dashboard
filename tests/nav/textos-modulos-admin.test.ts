/**
 * PULIDO 7, pasada 2 (parte 3/3): textos visibles de app/admin/observability en español.
 */
import { detectarEnFuente, detectarEnRutas } from "./detector-textos";

describe("textos visibles de admin/observability", () => {
  it("el detector marca los literales medidos en la base", () => {
    const antes = [
      'const a = <h1>Dashboard de observabilidad</h1>;',
      'const t = { label: "Dashboard" };',
    ].join("\n");
    expect(detectarEnFuente(antes, "base").map((h) => h.motivo)).toEqual([
      "inglés: «Dashboard»",
      "inglés: «Dashboard»",
    ]);
  });

  it("app/admin/observability no tiene hallazgos", () => {
    expect(detectarEnRutas(["app/admin/observability"])).toEqual([]);
  });
});
