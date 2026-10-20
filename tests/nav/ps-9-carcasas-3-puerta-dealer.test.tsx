/**
 * PS-9-CARCASAS-3 PARTE=1/1: las pruebas de tests/dealer/GlobalForgeAppShellDealer.test.tsx (regresión D2b: un usuario de
 * dealer NUNCA ve la Suite operativa; sin dealer, la Suite se pinta) TRASLADADAS a las carcasas que sustituyen a
 * GlobalForgeAppShell, ANTES de borrarla (REJECT regla (iv), César 20-oct 12:21). AppGate con la DealerSuiteGate REAL y el
 * ProtectedRoute REAL, sin simular ninguno de los dos (mismo patrón que nadakki-dashboard#1034): solo la consulta del
 * dealer (fetchMyDealerContext) y la sesión son de prueba.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppGate from "@/components/auth/AppGate";
import { AuthContext, type AuthContextValue } from "@/lib/auth/auth-context";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";

let pathname = "/agents";
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace, push: jest.fn() }),
  useSelectedLayoutSegments: () => [],
  useSearchParams: () => new URLSearchParams(),
}));
// La sesión que lee el ProtectedRoute REAL: autenticada y sin cambio de contraseña pendiente.
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u-carolina" }, isAuthenticated: true, isLoading: false, initError: null, mustChangePassword: false, logout: jest.fn() }),
}));
jest.mock("@/lib/dealer/dealer-context-api", () => ({ ...jest.requireActual("@/lib/dealer/dealer-context-api"), fetchMyDealerContext: jest.fn() }));
jest.mock("@/components/white-label/TenantBrandedDocumentTitle", () => ({ __esModule: true, TenantBrandedDocumentTitle: () => null }));
jest.mock("@/components/nav/BuscadorNavegacion", () => ({ __esModule: true, EVENTO_ABRIR_BUSCADOR: "nadakki:abrir-buscador", BuscadorNavegacion: () => null }));
jest.mock("@/components/forge/auth/UserMenu", () => ({ __esModule: true, UserMenu: () => <button type="button">Usuario</button> }));
jest.mock("@/components/forge/auth/TenantSwitcher", () => ({ __esModule: true, TenantSwitcher: () => null }));
jest.mock("@/components/realtor/useRealtorAccess", () => ({ __esModule: true, useRealtorAccess: () => "apagado" }));
jest.mock("@/components/ai/OnboardingAgent", () => ({ __esModule: true, default: () => null }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));

const fetchMock = fetchMyDealerContext as jest.MockedFunction<typeof fetchMyDealerContext>;
const sesion = {
  user: { id: "u-carolina", email: "carolina@nadakki.test" },
  tenant: { id: "t", display_name: "QA", subscribed_cores: ["credit", "marketing"] },
  allRoles: [{ core_name: "x", role_key: "platform_superadmin", display_name: "Superadmin" }],
  fijarContexto: jest.fn(),
} as unknown as AuthContextValue;

function pintar(ruta: string) {
  pathname = ruta;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={sesion}>
        <AppGate><p>contenido</p></AppGate>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
});

// Rutas que antes pintaba GlobalForgeAppShell: sin módulo (Suite), una de Crédito y la carcasa propia del portal del dealer.
const RUTAS = ["/agents", "/dashboard", "/sic", "/credit-hub/dealer"];

test.each(RUTAS)("%s: un usuario con dealer no ve la Suite operativa: la puerta lo manda a /autos/dealer", async (ruta) => {
  fetchMock.mockResolvedValue([{ dealerId: "d1", organizationUnitId: null, dealerName: "Mapaal" }]);
  pintar(ruta);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/autos/dealer"));
  expect(screen.queryByText("contenido")).toBeNull();
  expect(screen.queryByRole("complementary", { name: /^Menú de / })).toBeNull();
  expect(screen.getByTestId("suite-redirigiendo-dealer")).toBeInTheDocument();
});

test.each(RUTAS)("%s: sin dealer se pinta la Suite y el contenido, sin redirección", async (ruta) => {
  fetchMock.mockResolvedValue([]);
  pintar(ruta);
  expect(await screen.findByText("contenido")).toBeInTheDocument();
  expect(screen.getAllByTestId("barra-suite")).toHaveLength(1);
  expect(replace).not.toHaveBeenCalled();
});

test("sin dealer, una ruta sin módulo trae el menú de la Suite (lo que daba la barra lateral de GlobalForgeAppShell)", async () => {
  fetchMock.mockResolvedValue([]);
  pintar("/agents");
  expect(await screen.findByText("contenido")).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: "Menú de Suite" })).toBeInTheDocument();
});
