/**
 * PS-9-CARCASAS-2 PARTE=2/7: dentro de ModuleShell, DealerShell NO pinta su menú, su barra ni su paleta (eso lo da el
 * armazón común), pero conserva lo que es del dealer: la sincronización del dealer de la sesión, los avisos, el tema
 * DCC del contenido (data-portal="dealer") y sus acciones (tema, notificaciones y Publicar, con los MISMOS permisos
 * que tenía su barra), y el aviso «No se pudieron verificar tus accesos» que antes iba en su menú. Fuera de
 * ModuleShell todo sigue como hoy (la parte 3/5 es la que mueve el dealer al armazón común).
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DealerLayout from "@/app/autos/dealer/layout";
import { DEALER_NAV_CAPABILITY_KEYS } from "@/components/dealer-management/shell/dealer-nav";

jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
let pathname = "/autos/dealer/inventario";
jest.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }) }));
const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys) }));
let mockDentro = true;
jest.mock("@/components/shell/ModuleShell", () => ({ useDentroDeModuleShell: () => mockDentro }));

const TENANT = "tenant-qa";
const lote = (permitidas: string[], motivo: string | null = null) => ({
  isError: false, error: null, isPending: false, isLoading: false,
  data: { results: Object.fromEntries(DEALER_NAV_CAPABILITY_KEYS.map((k) => [k, { allowed: permitidas.includes(k), reason_code: motivo }])) },
});

function pintar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["dealer-context-sync", TENANT], { estado: "sincronizado", assignment: { dealerId: "d-1", organizationUnitId: null, dealerName: "Concesionario QA" } });
  return render(<QueryClientProvider client={client}><DealerLayout><p>pantalla del dealer</p></DealerLayout></QueryClientProvider>);
}

beforeEach(() => {
  mockDentro = true;
  pathname = "/autos/dealer/inventario";
  batchMock.mockReset();
  batchMock.mockReturnValue(lote(DEALER_NAV_CAPABILITY_KEYS));
  window.localStorage.clear();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

describe("DealerShell dentro de ModuleShell", () => {
  test("sin menú, barra ni paleta propios; el contenido y el tema del dealer siguen", () => {
    const { container } = pintar();
    expect(screen.getByText("pantalla del dealer")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Navegación del dealer" })).toBeNull();
    expect(screen.queryByTestId("dealer-sidebar")).toBeNull();
    expect(screen.queryByTestId("dealer-topbar")).toBeNull();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });               // Ctrl+K es del buscador del armazón
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector('[data-portal="dealer"]')).not.toBeNull();
  });

  test("acciones del dealer con los mismos permisos que su barra: tema, notificaciones y Publicar", () => {
    pintar();
    expect(screen.queryByTestId("dealer-topbar")).toBeNull();
    const acciones = within(screen.getByTestId("dealer-acciones"));
    expect(acciones.getByTestId("dealer-theme-toggle")).toBeInTheDocument();
    expect(acciones.getByRole("link", { name: "Notificaciones" })).toHaveAttribute("href", "/credit-hub/dealer");
    expect(acciones.getByRole("link", { name: "Publicar vehículo" })).toHaveAttribute("href", "/autos/dealer/publicar-rapido");
  });

  test("sin permiso no hay Publicar ni notificaciones", () => {
    batchMock.mockReturnValue(lote([]));
    pintar();
    expect(screen.queryByTestId("dealer-topbar")).toBeNull();
    const acciones = within(screen.getByTestId("dealer-acciones"));
    expect(acciones.queryByRole("link", { name: "Publicar vehículo" })).toBeNull();
    expect(acciones.queryByRole("link", { name: "Notificaciones" })).toBeNull();
    expect(acciones.getByTestId("dealer-theme-toggle")).toBeInTheDocument();
  });

  test("el aviso de accesos sin verificar sigue a la vista (antes iba en el menú del dealer)", () => {
    batchMock.mockReturnValue(lote([], "no_organization_unit"));
    pintar();
    expect(screen.queryByTestId("dealer-sidebar")).toBeNull();
    const aviso = screen.getByTestId("dealer-acceso-no-verificado");
    expect(aviso).toHaveAttribute("data-reason-code", "no_organization_unit");
    expect(aviso).toHaveTextContent("No se pudieron verificar tus accesos");
  });
});

describe("DealerShell fuera de ModuleShell: como hoy", () => {
  test("pinta su menú y su barra", () => {
    mockDentro = false;
    pintar();
    expect(screen.getByRole("navigation", { name: "Navegación del dealer" })).toBeInTheDocument();
    expect(screen.getByTestId("dealer-topbar")).toBeInTheDocument();
  });
});
