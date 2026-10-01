/**
 * Un solo menu en el panel del dealer.
 *
 * `isDealerManagementPath` existia en lib/autos-portal/routes.ts con su test y
 * con un docstring que AFIRMA que el panel del dealer "queda fuera del
 * GlobalForgeAppShell y de la barra del marketplace". Medido: nadie la llamaba.
 * El predicado estaba probado y la conducta no existia, asi que en produccion
 * seguian apilados la barra "Suite operativa", la del marketplace y el menu del
 * dealer.
 *
 * Estos casos miden la conducta en los dos sitios que la montan: `AppGate`
 * (shell global de cores) y `TopNav` (barra del marketplace). Y miden tambien
 * que SIGUEN apareciendo en la vitrina publica: quitarlas de todas partes
 * romperia el marketplace, que es donde esas barras si corresponden.
 */
import { render, screen } from "@testing-library/react";

import AppGate from "@/components/auth/AppGate";
import { TopNav } from "@/components/nav/TopNav";

let pathname = "/autos/dealer";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected">{children}</div>
  ),
}));

jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="suite-operativa">{children}</div>
  ),
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-agent" />,
}));

jest.mock("@/components/nav/MatchMyApprovalModal", () => ({
  MatchMyApprovalModal: () => null,
}));

jest.mock("@/components/autos/CartBadge", () => ({ CartBadge: () => null }));

jest.mock("@/components/system/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: jest.fn() }),
}));

jest.mock("@/components/system/TenantProvider", () => ({
  useTenant: () => ({ tenant: "nadakki", config: { name: "Nadakki" }, setTenant: jest.fn() }),
}));

jest.mock("@/components/shopper/ShopperProvider", () => ({
  useShopper: () => ({ newMatchCount: 0, profile: null }),
}));

describe("AppGate: la barra Suite operativa no entra en el panel del dealer", () => {
  it("bajo /autos/dealer protege la ruta pero no monta el shell global de cores", () => {
    pathname = "/autos/dealer";
    render(
      <AppGate>
        <p>contenido</p>
      </AppGate>,
    );
    expect(screen.getByTestId("protected")).toBeInTheDocument();
    expect(screen.queryByTestId("suite-operativa")).toBeNull();
  });

  it("tambien en las subrutas del panel", () => {
    pathname = "/autos/dealer/finanzas";
    render(
      <AppGate>
        <p>contenido</p>
      </AppGate>,
    );
    expect(screen.queryByTestId("suite-operativa")).toBeNull();
  });

  it("en una ruta de hub cualquiera el shell global sigue montandose", () => {
    pathname = "/credit-hub/dealer";
    render(
      <AppGate>
        <p>contenido</p>
      </AppGate>,
    );
    expect(screen.getByTestId("suite-operativa")).toBeInTheDocument();
  });

  it("/autos/dealership no es el panel y no se le quita el shell", () => {
    pathname = "/autos/dealership";
    render(
      <AppGate>
        <p>contenido</p>
      </AppGate>,
    );
    expect(screen.getByTestId("suite-operativa")).toBeInTheDocument();
  });
});

describe("TopNav: la barra del marketplace no entra en el panel del dealer", () => {
  it("bajo /autos/dealer no pinta nada", () => {
    pathname = "/autos/dealer";
    const { container } = render(<TopNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ni en las subrutas del panel", () => {
    pathname = "/autos/dealer/inventario/nuevo";
    const { container } = render(<TopNav />);
    expect(container).toBeEmptyDOMElement();
  });

  it("en la vitrina publica sigue con Vender, Dealers y Mi Shopper", () => {
    pathname = "/autos/vehiculos";
    render(<TopNav />);
    expect(screen.getByRole("link", { name: "Vender" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dealers" })).toBeInTheDocument();
    expect(screen.getByText("Match My Approval")).toBeInTheDocument();
  });
});
