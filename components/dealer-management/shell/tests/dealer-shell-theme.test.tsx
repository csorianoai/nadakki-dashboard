import { readFileSync } from "fs";
import { join } from "path";
import { fireEvent, render, screen } from "@testing-library/react";
import { DccThemeProvider, useDccThemeContext } from "@/components/dcc/DccThemeContext";
import { DccPage } from "@/components/dcc/DccPage";
import {
  dealerShellThemeStyle,
  DEALER_SHELL_VARIABLES_LEGADO,
  DEALER_THEME_STORAGE_KEY,
} from "@/components/dealer-management/shell/dealer-shell-theme";
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
      const destino = /^var\((--dcc-[a-z0-9-]+)\)$/.exec(estilo[clave])?.[1];
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

  it("barra lateral MARINA con item activo dorado y foco turquesa (no pasa a blanco)", () => {
    const estilo = dealerShellThemeStyle("light") as Record<string, string>;
    expect(estilo["--nav-bg"]).toBe("var(--dcc-navy)");
    expect(estilo["--dcc-navy"]).toBe("#0B1220");
    expect(estilo["--nav-fg"]).toBe("var(--dcc-on-navy)");
    const sidebar = SHELL[1];
    expect(sidebar).toContain("text-[var(--dcc-gold)]");
    expect(sidebar).toContain("ring-[var(--dcc-teal)]");
    expect(sidebar).not.toContain("--dcc-action");
  });

  it("la firma bajo la marca es la constante del producto", () => {
    expect(SHELL[1]).toContain("DCC_PRODUCTO.firma");
    expect(SHELL[1]).not.toContain("Powered by Nadakki");
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

describe("El panel del dealer recuerda el tema al recargar", () => {
  const CLAVE = DEALER_THEME_STORAGE_KEY;

  function Sonda() {
    const tema = useDccThemeContext();
    return (
      <>
        <span data-testid="sonda">{tema?.theme}</span>
        <button type="button" onClick={() => tema?.setTheme("dark")}>
          oscuro
        </button>
      </>
    );
  }

  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("elegir oscuro y volver a montar: sigue oscuro", () => {
    const primero = render(
      <DccThemeProvider storageKey={CLAVE}>
        <Sonda />
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("light");
    fireEvent.click(screen.getByText("oscuro"));
    expect(window.localStorage.getItem(CLAVE)).toBe("dark");
    primero.unmount();

    render(
      <DccThemeProvider storageKey={CLAVE}>
        <Sonda />
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("dark");
  });

  it("Local Storage que lanza no rompe: cae a claro y el conmutador sigue funcionando", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    render(
      <DccThemeProvider storageKey={CLAVE}>
        <Sonda />
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("light");
    fireEvent.click(screen.getByText("oscuro"));
    expect(screen.getByTestId("sonda")).toHaveTextContent("dark");
  });

  it("un valor guardado que no es un tema se ignora", () => {
    window.localStorage.setItem(CLAVE, "sepia");
    render(
      <DccThemeProvider storageKey={CLAVE}>
        <Sonda />
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("light");
  });

  it("sin storageKey (DccShell y demas) no lee ni escribe Local Storage", () => {
    window.localStorage.setItem(CLAVE, "dark");
    const lee = jest.spyOn(Storage.prototype, "getItem");
    const escribe = jest.spyOn(Storage.prototype, "setItem");
    render(
      <DccThemeProvider>
        <Sonda />
      </DccThemeProvider>,
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("light");
    fireEvent.click(screen.getByText("oscuro"));
    expect(screen.getByTestId("sonda")).toHaveTextContent("dark");
    expect(lee).not.toHaveBeenCalled();
    expect(escribe).not.toHaveBeenCalled();
  });

  it("el DealerShell pasa SU clave; DccShell (banco v2) solo usa la que le da su llamador", () => {
    expect(SHELL[0]).toContain("<DccThemeProvider storageKey={DEALER_THEME_STORAGE_KEY}>");
    const dccShell = readFileSync(join(__dirname, "..", "..", "..", "dcc", "shell", "DccShell.tsx"), "utf8");
    expect(dccShell).toContain("<DccThemeProvider storageKey={props.temaStorageKey} conmutadorEnChrome>");
    expect(dccShell).not.toContain("DEALER_THEME_STORAGE_KEY");
    const bancoV2 = readFileSync(join(__dirname, "..", "..", "..", "..", "app", "(forge)", "credit-hub", "bank-v2", "BancoV2Shell.tsx"), "utf8");
    expect(bancoV2).not.toContain(DEALER_THEME_STORAGE_KEY);
  });
});
