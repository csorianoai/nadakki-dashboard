/** Cowork 26-nov: la barra del portal mostraba el avatar "JR" aunque nadie hubiera iniciado sesion. */
import { render, screen } from "@testing-library/react";
import { TopNav } from "@/components/nav/TopNav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/vehiculos",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/components/autos/CartBadge", () => ({ CartBadge: () => null }));
jest.mock("@/components/system/ThemeProvider", () => ({ useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }) }));
jest.mock("@/components/system/TenantProvider", () => ({
  useTenant: () => ({ tenant: "nadakki", config: { name: "Nadakki" }, setTenant: jest.fn() }),
}));
jest.mock("@/components/shopper/ShopperProvider", () => ({ useShopper: () => ({ newMatchCount: 0, profile: null }) }));

test("sin sesion, la barra del portal no pinta ningun avatar de usuario", () => {
  render(<TopNav />);
  expect(screen.getByRole("link", { name: "Vender" })).toBeInTheDocument(); // la barra si se pinto
  expect(screen.queryByLabelText(/^Usuario/)).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\bJR\b/);
});
