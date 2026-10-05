import { DCC_TOKEN_KEYS, DCC_TOKENS, dccThemeStyle } from "@/lib/dcc/tokens";

describe("tokens DCC", () => {
  it("claro y oscuro definen exactamente las mismas claves", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(Object.keys(DCC_TOKENS[theme]).sort()).toEqual([...DCC_TOKEN_KEYS].sort());
    }
  });

  it("tema claro = referencia v3: lienzo gris claro y tarjeta blanca", () => {
    expect(DCC_TOKENS.light["--dcc-canvas"]).toBe("#EEF2F7");
    expect(DCC_TOKENS.light["--dcc-surface"]).toBe("#FFFFFF");
    expect(DCC_TOKENS.light["--dcc-radius"]).toBe("12px");
  });

  it("un solo color de accion por tema", () => {
    const acciones = Object.keys(DCC_TOKENS.light).filter((k) => k.startsWith("--dcc-action") && !k.endsWith("hover"));
    expect(acciones).toEqual(["--dcc-action"]);
  });

  it("el estilo raiz expone las variables del tema pedido", () => {
    const estilo = dccThemeStyle("dark") as Record<string, string>;
    expect(estilo["--dcc-canvas"]).toBe(DCC_TOKENS.dark["--dcc-canvas"]);
  });
});
