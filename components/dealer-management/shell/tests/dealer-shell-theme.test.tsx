import { readFileSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { DccThemeProvider, useDccThemeContext } from "@/components/dcc/DccThemeContext";
import { DccPage } from "@/components/dcc/DccPage";
import { dealerShellThemeStyle, DEALER_SHELL_VARIABLES_LEGADO } from "@/components/dealer-management/shell/dealer-shell-theme";
import { DCC_TOKEN_KEYS } from "@/lib/dcc/tokens";

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS" } }),
}));

const SHELL = ["DealerShell.tsx", "DealerSidebar.tsx", "DealerTopbar.tsx", "DealerCommandPalette.tsx"].map((f) =>
  readFileSync(join(__dirname, "..", f), "utf8"),
);

describe("DealerShell sobre los tokens del DCC", () => {
  it("cada variable heredada apunta a un token DCC que existe en claro y oscuro", () => {
    const estilo = dealerShellThemeStyle("light") as Record<string, string>;
    for (const clave of DEALER_SHELL_VARIABLES_LEGADO) {
      const destino = /^var\((--dcc-[a-z-]+)\)$/.exec(estilo[clave])?.[1];
      expect(destino && (DCC_TOKEN_KEYS as string[]).includes(destino)).toBe(true);
    }
  });

  it("toda variable que usan sidebar, topbar y paleta queda redefinida (ninguna cae al tema oscuro viejo)", () => {
    const usadas = new Set(SHELL.flatMap((src) => [...src.matchAll(/var\((--(?!dcc-)[a-z0-9-]+)\)/g)].map((m) => m[1])));
    const redefinidas = new Set(DEALER_SHELL_VARIABLES_LEGADO);
    const faltan = [...usadas].filter((v) => !redefinidas.has(v) && !["--r", "--shadow-lg"].includes(v));
    expect(faltan).toEqual([]);
  });

  it("sin colores fijos de tema oscuro en el chrome", () => {
    for (const src of SHELL) expect(src).not.toMatch(/text-white|bg-white\/|ring-white|text-amber-/);
  });

  it("el tema claro deja la barra lateral en superficie clara, no oscura", () => {
    const estilo = dealerShellThemeStyle("light") as Record<string, string>;
    expect(estilo["--nav-bg"]).toBe("var(--dcc-surface)");
    expect(estilo["--dcc-surface"]).toBe("#FFFFFF");
  });

  it("dentro del shell, el conmutador de una pagina v2 cambia el tema compartido", () => {
    function Sonda() {
      return <span data-testid="sonda">{useDccThemeContext()?.theme}</span>;
    }
    render(
      <DccThemeProvider>
        <Sonda />
        <DccPage titulo="Inicio">x</DccPage>
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("light");
    fireEvent.click(screen.getByTestId("dcc-theme-toggle"));
    expect(screen.getByTestId("sonda")).toHaveTextContent("dark");
  });
});
