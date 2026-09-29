/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerInicioPage from "@/app/autos/dealer/page";
import { COPY_BLOQUE } from "@/lib/dealer-management/bloque-estado";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ isAuthenticated: true, role: "dealer", tenantId: "tenant-a" }),
}));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer",
  useRouter: () => ({ push: jest.fn() }),
}));

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
function testClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const VEHICULOS = [
  { id: "v1", make: "Toyota", model: "Corolla", year: "2020", status: "in_stock" },
  { id: "v2", make: "Ford", model: "Focus", year: "2019", status: "in_stock" },
];

function mockBackend({ dias }: { dias: Record<string, number> }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/vehicles") && !url.includes("/days")) return jsonResponse(VEHICULOS);
    const match = url.match(/\/vehicles\/([^/]+)\/days/);
    if (match) return jsonResponse({ days_in_inventory: dias[match[1]] ?? null });
    if (url.includes("/leads")) {
      return jsonResponse([
        { id: "l1", status: "new" },
        { id: "l2", status: "contacted" },
      ]);
    }
    if (url.includes("unread-summary")) return jsonResponse({ unread_count: 3 });
    if (url.includes("entitlements/batch")) return jsonResponse({ results: {} });
    return jsonResponse({}, 404);
  }) as unknown as typeof fetch;
}

describe("Inicio del dealer — solo datos reales", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  });

  test("los KPI sin fuente en el backend dicen «no disponible aún», nunca una cifra", async () => {
    mockBackend({ dias: { v1: 10, v2: 120 } });
    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    for (const etiqueta of [
      "Carros vendidos (mes)",
      "Beneficio y gastos (mes)",
      "Comisiones a vendedores",
      "Cuentas por pagar",
    ]) {
      const tarjeta = await screen.findByText(etiqueta);
      const caja = tarjeta.closest("[data-kpi]") as HTMLElement;
      expect(within(caja).getByText(COPY_BLOQUE.no_disponible)).toBeInTheDocument();
      // Sin cifra: la tarjeta no pinta el valor, ni siquiera un cero.
      expect(caja.querySelector("[data-kpi-valor]")).toBeNull();
      // Y no es un enlace: no hay destino util mientras no exista la fuente.
      expect(caja.tagName).not.toBe("A");
    }
  });

  test("stock y antigüedad salen de /vehicles y /days reales", async () => {
    mockBackend({ dias: { v1: 10, v2: 120 } });
    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    // Se vuelve a buscar la tarjeta en cada intento: al resolverse pasa de
    // <div> a <a>, asi que una referencia capturada antes queda obsoleta.
    const valorDe = (etiqueta: string) =>
      screen.getByText(etiqueta).closest("[data-kpi]")?.querySelector("[data-kpi-valor]")
        ?.textContent ?? null;

    await waitFor(() => expect(valorDe("Vehículos en stock")).toBe("2"));
    // Promedio de 10 y 120 = 65 dias.
    await waitFor(() => expect(valorDe("Días promedio en stock")).toBe("65 días"));
  });

  test("la alerta de +90 días lleva al inventario YA FILTRADO", async () => {
    mockBackend({ dias: { v1: 10, v2: 120 } });
    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    const accion = await screen.findByRole("link", { name: /Ver 1/ });
    expect(accion).toHaveAttribute("href", "/autos/dealer/inventario?antiguedad=90");
  });

  test("sin vehículos con más de 90 días no se pinta la alerta", async () => {
    mockBackend({ dias: { v1: 10, v2: 20 } });
    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    await screen.findByText("Vehículos en stock");
    await waitFor(() => expect(screen.queryByRole("link", { name: /^Ver \d/ })).toBeNull());
  });

  test("las tareas de hoy salen del estado real y llevan al caso concreto", async () => {
    mockBackend({ dias: { v1: 10, v2: 20 } });
    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    const leads = await screen.findByRole("link", { name: /Leads sin contactar/ });
    expect(leads).toHaveAttribute("href", "/autos/dealer/leads?estado=nuevo");

    const mensajes = await screen.findByRole("link", { name: /Mensajes sin leer/ });
    expect(mensajes).toHaveAttribute("href", "/credit-hub/dealer");
  });

  test("si el inventario falla, el bloque ofrece reintentar (no se queda cargando)", async () => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) =>
      String(input).includes("entitlements/batch")
        ? jsonResponse({ results: {} })
        : jsonResponse({ detail: "boom" }, 500),
    ) as unknown as typeof fetch;

    render(<DealerInicioPage />, { wrapper: wrapper(testClient()) });

    await waitFor(() =>
      expect(screen.getAllByText(COPY_BLOQUE.error).length).toBeGreaterThan(0),
    );
    expect(screen.getAllByRole("button", { name: /Reintentar/ }).length).toBeGreaterThan(0);
  });
});
