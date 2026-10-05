/**
 * Auditoria QA del panel del dealer (/autos/dealer):
 *
 *  P1-4  hay un "Cerrar sesión" visible en el pie del sidebar, y llama al
 *        logout de la sesion V2 y despues lleva a /login;
 *  FAB   el boton "Concierge AI" no se coloca en la esquina inferior IZQUIERDA,
 *        que es donde queda el pie del sidebar;
 *  P2    la topbar no tiene fondo blanco fijo: usa el token del tema DCC, que
 *        en oscuro no es blanco.
 *
 * `@/lib/auth/auth-context` se sustituye por un contexto con la misma forma: el
 * real resuelve la URL del backend al cargarse y lanza sin backend declarado.
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { createContext, type ReactNode } from "react";

import { DealerSidebar } from "@/components/dealer-management/shell/DealerSidebar";
import { DealerTopbar } from "@/components/dealer-management/shell/DealerTopbar";
import { dealerShellThemeStyle } from "@/components/dealer-management/shell/dealer-shell-theme";
import { ConciergeFab } from "@/components/concierge/ConciergeFab";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer",
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores" } }),
}));

jest.mock("@/lib/auth/auth-context", () => {
  const { createContext: crear } = require("react");
  return { AuthContext: crear(null) };
});

const { AuthContext } = require("@/lib/auth/auth-context") as {
  AuthContext: ReturnType<typeof createContext<{ logout: () => Promise<void> } | null>>;
};

function ConSesion({ logout, children }: { logout: () => Promise<void>; children: ReactNode }) {
  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>;
}

function sidebar(collapsed = false) {
  return (
    <DealerSidebar
      groups={[]}
      loading={false}
      mobileOpen={false}
      onClose={() => {}}
      collapsed={collapsed}
      onToggleCollapsed={() => {}}
    />
  );
}

beforeEach(() => mockPush.mockReset());

describe("P1-4: Cerrar sesión en el pie del sidebar", () => {
  it("se pinta en el pie fijo y llama al logout existente antes de ir a /login", async () => {
    const logout = jest.fn(async () => {});
    render(<ConSesion logout={logout}>{sidebar()}</ConSesion>);

    const boton = await screen.findByRole("button", { name: "Cerrar sesión" });
    expect(screen.getByTestId("dealer-sidebar-footer")).toContainElement(boton);
    expect(screen.getByTestId("dealer-sidebar-footer").className).toContain("shrink-0");

    fireEvent.click(boton);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0]);
  });

  it("en barra estrecha sigue con nombre accesible y tooltip", async () => {
    render(<ConSesion logout={jest.fn(async () => {})}>{sidebar(true)}</ConSesion>);
    const boton = await screen.findByRole("button", { name: "Cerrar sesión" });
    expect(boton).toHaveAttribute("title", "Cerrar sesión");
  });

  it("aunque el logout falle, navega a /login", async () => {
    const consola = jest.spyOn(console, "error").mockImplementation(() => {});
    const logout = jest.fn(async () => {
      throw new Error("red");
    });
    render(<ConSesion logout={logout}>{sidebar()}</ConSesion>);
    fireEvent.click(await screen.findByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/login"));
    consola.mockRestore();
  });
});

describe("Concierge AI no tapa el pie del sidebar", () => {
  it("va abajo a la derecha, nunca a la izquierda", () => {
    render(<ConciergeFab visible onClick={() => {}} />);
    const fab = screen.getByRole("button", { name: "Abrir Concierge AI" });
    expect(fab.className).toMatch(/\bfixed\b/);
    expect(fab.className).toMatch(/\bright-6\b/);
    expect(fab.className).not.toMatch(/\bleft-\d/);
  });
});

describe("P2: topbar con el token del tema", () => {
  it("usa --dcc-surface y no bg-white; en oscuro el token no es blanco", () => {
    render(
      <div style={dealerShellThemeStyle("dark")}>
        <DealerTopbar canPublish={false} canSeeNotifications={false} onMenuClick={() => {}} onSearchClick={() => {}} />
      </div>,
    );
    const topbar = screen.getByTestId("dealer-topbar");
    expect(topbar.className).toContain("bg-[var(--dcc-surface)]");
    expect(topbar.className).not.toMatch(/\bbg-white\b/);

    const oscuro = dealerShellThemeStyle("dark") as Record<string, string>;
    expect(oscuro["--dcc-surface"]).toBe("#111A2B");
    expect((dealerShellThemeStyle("light") as Record<string, string>)["--dcc-surface"]).toBe("#FFFFFF");
  });
});
