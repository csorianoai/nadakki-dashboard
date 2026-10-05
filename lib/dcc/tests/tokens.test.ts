import { DCC_TOKEN_KEYS, DCC_TOKENS, dccThemeStyle } from "@/lib/dcc/tokens";

describe("tokens DCC", () => {
  it("claro y oscuro definen exactamente las mismas claves", () => {
    for (const theme of ["light", "dark"] as const) {
      expect(Object.keys(DCC_TOKENS[theme]).sort()).toEqual([...DCC_TOKEN_KEYS].sort());
    }
  });

  it("tema claro: lienzo gris muy claro y tarjeta blanca", () => {
    expect(DCC_TOKENS.light["--dcc-canvas"]).toBe("#F5F7FA");
    expect(DCC_TOKENS.light["--dcc-surface"]).toBe("#FFFFFF");
    expect(DCC_TOKENS.light["--dcc-radius"]).toBe("12px");
  });

  it("roles fijos: marino para barra y boton principal, dorado y turquesa como acentos", () => {
    const t = DCC_TOKENS.light;
    expect(t["--dcc-navy"]).toBe("#0B1220");
    expect(t["--dcc-action"]).toBe(t["--dcc-navy"]);
    expect(t["--dcc-fg"]).toBe(t["--dcc-navy"]);
    expect(t["--dcc-gold"]).toBe("#C9A227");
    expect(t["--dcc-teal"]).toBe("#0EA5A4");
  });

  it("el estilo raiz expone las variables del tema pedido", () => {
    const estilo = dccThemeStyle("dark") as Record<string, string>;
    expect(estilo["--dcc-canvas"]).toBe(DCC_TOKENS.dark["--dcc-canvas"]);
  });
});
