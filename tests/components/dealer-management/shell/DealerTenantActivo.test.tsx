/**
 * Auditoria Mapaal QA (P1): indicador discreto del tenant ACTIVO en el shell.
 *
 * La marca del sidebar sale del branding (y cae a "Nadakki" mientras carga); el
 * indicador sale de la SESION, que es con la que se firman las peticiones.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { DealerSidebar } from "@/components/dealer-management/shell/DealerSidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { display_name: "Mapaal Automotores" } }),
}));

jest.mock("@/lib/auth/auth-context", () => {
  const { createContext: crear } = require("react");
  return { AuthContext: crear(null) };
});

type Sesion = { tenant: { id: string; display_name?: string; slug?: string } | null; logout: () => Promise<void> };
const { AuthContext } = require("@/lib/auth/auth-context") as {
  AuthContext: React.Context<Sesion | null>;
};

function conSesion(sesion: Sesion | null, children: ReactNode) {
  return <AuthContext.Provider value={sesion}>{children}</AuthContext.Provider>;
}

function sidebar(collapsed = false) {
  return (
    <DealerSidebar groups={[]} loading={false} mobileOpen={false} onClose={() => {}} collapsed={collapsed} onToggleCollapsed={() => {}} />
  );
}

const logout = async () => {};

it("muestra el tenant de la sesion en el pie del sidebar, junto a Cerrar sesión", async () => {
  render(conSesion({ tenant: { id: "t-1", display_name: "Mapaal QA", slug: "mapaal-qa" }, logout }, sidebar()));
  const indicador = await screen.findByTestId("dealer-tenant-activo");
  expect(indicador).toHaveTextContent("Mapaal QA");
  expect(indicador).toHaveAttribute("title", "Cuenta activa: Mapaal QA (mapaal-qa)");
  expect(screen.getByTestId("dealer-sidebar-footer")).toContainElement(indicador);
});

it("en barra estrecha queda el icono con nombre accesible y tooltip", async () => {
  render(conSesion({ tenant: { id: "t-1", display_name: "Mapaal QA" }, logout }, sidebar(true)));
  const indicador = await screen.findByTestId("dealer-tenant-activo");
  expect(indicador).toHaveTextContent("Cuenta activa: Mapaal QA");
  expect(indicador.querySelector(".sr-only")).not.toBeNull();
});

it("sin tenant en la sesion no se inventa uno", async () => {
  render(conSesion({ tenant: null, logout }, sidebar()));
  await screen.findByRole("button", { name: "Cerrar sesión" });
  expect(screen.queryByTestId("dealer-tenant-activo")).toBeNull();
});
