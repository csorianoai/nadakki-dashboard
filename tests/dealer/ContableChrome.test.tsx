/**
 * /contable/* dentro del panel del dealer (auditoria Mapaal QA, P1).
 *
 * Un dealer que abria "Libro mayor" desde su menu caia en el chrome de la Suite
 * --Marketing Hub, Credit Hub, Compliance (root), Legacy y herramientas--. Ahora
 * un usuario con asignacion de dealer ve el shell del dealer; el resto, la Suite
 * como antes. La senal es la de DealerSuiteGate: GET /api/v1/autos/me/dealer-context.
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AppGate from "@/components/auth/AppGate";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

let pathname = "/contable/libro-mayor";
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-carolina" } }),
}));

jest.mock("@/lib/dealer/dealer-context-api", () => ({
  fetchMyDealerContext: jest.fn(),
}));

jest.mock("@/components/forge/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

jest.mock("@/components/forge/layout/GlobalForgeAppShell", () => ({
  GlobalForgeAppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="suite-operativa">{children}</div>
  ),
}));

jest.mock("@/components/dealer-management/shell/DealerShell", () => ({
  DealerShell: ({ children }: { children: React.ReactNode }) => <div data-testid="dealer-shell">{children}</div>,
}));

jest.mock("@/components/ai/OnboardingAgent", () => ({
  __esModule: true,
  default: () => <div data-testid="onboarding-agent" />,
}));

const fetchMock = fetchMyDealerContext as jest.MockedFunction<typeof fetchMyDealerContext>;

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AppGate>
        <p>libro mayor</p>
      </AppGate>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  pathname = "/contable/libro-mayor";
  fetchMock.mockReset();
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test("mientras consulta no pinta ningun chrome", () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  montar();
  expect(screen.getByTestId("contable-verificando")).toHaveTextContent("Verificando");
  expect(screen.queryByTestId("suite-operativa")).toBeNull();
  expect(screen.queryByTestId("dealer-shell")).toBeNull();
});

test("un usuario de dealer ve la contabilidad dentro de su panel, sin la Suite", async () => {
  fetchMock.mockResolvedValue([{ dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" }]);
  montar();
  expect(await screen.findByTestId("dealer-shell")).toHaveTextContent("libro mayor");
  expect(screen.queryByTestId("suite-operativa")).toBeNull();
  expect(screen.queryByTestId("onboarding-agent")).toBeNull();
  expect(screen.getByTestId("protected")).toBeInTheDocument();
});

test("tambien en /contable", async () => {
  pathname = "/contable";
  fetchMock.mockResolvedValue([{ dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" }]);
  montar();
  expect(await screen.findByTestId("dealer-shell")).toBeInTheDocument();
});

test("un usuario sin asignacion de dealer sigue viendo la Suite, como antes", async () => {
  fetchMock.mockResolvedValue([]);
  montar();
  expect(await screen.findByTestId("suite-operativa")).toHaveTextContent("libro mayor");
  expect(screen.getByTestId("onboarding-agent")).toBeInTheDocument();
  expect(screen.queryByTestId("dealer-shell")).toBeNull();
});

test("si la consulta falla se pinta la Suite: no deja a nadie sin menu", async () => {
  fetchMock.mockRejectedValue(new Error("502"));
  montar();
  expect(await screen.findByTestId("suite-operativa")).toBeInTheDocument();
  expect(screen.queryByTestId("dealer-shell")).toBeNull();
});

test("fuera de /contable no se consulta: el resto de la Suite no cambia", () => {
  pathname = "/credit-hub/dealer";
  montar();
  expect(screen.getByTestId("suite-operativa")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("/contabilidad no es /contable", () => {
  pathname = "/contabilidad";
  montar();
  expect(screen.getByTestId("suite-operativa")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});
