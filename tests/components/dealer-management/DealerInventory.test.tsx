/** @jest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerInventoryPage from "@/app/autos/dealer/inventario/page";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";
import { apiFetch } from "@/lib/api/fetch-client";
import { resolveDealerAccessContext, selectedDealerIdentity } from "@/lib/dealer/access-context";
import { fetchDealerInventory } from "@/lib/dealer-management/inventory";

jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: jest.fn() }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
/**
 * `selectedDealerIdentity` entra en el mock porque la pantalla ya no decide con
 * `resolveDealerAccessContext`: el acceso lo decide el batch, y el identity solo
 * aporta el `dealerId` con el que CONSTRUIR la peticion. Devuelve los ids aunque
 * falte la unidad organizativa, que es el caso real de Mapaal.
 */
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: jest.fn(),
  selectedDealerIdentity: jest.fn(),
}));

const CAPABILITY = "autos.inventory.list";
const PRIVATE_ROUTE = "/api/v1/autos/dealers/dealer-a/vehicles";
const MARKETPLACE_ROUTE = "/api/v1/autos/marketplace/dealers/dealer-a/listings";
const mockedEntitlements = useAccessEntitlementsBatch as unknown as jest.Mock;
const mockedApiFetch = apiFetch as unknown as jest.Mock;
const mockedResolveContext = resolveDealerAccessContext as unknown as jest.Mock;
const mockedIdentity = selectedDealerIdentity as unknown as jest.Mock;

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function testClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function readyDealer() {
  mockedResolveContext.mockReturnValue({
    status: "ready",
    context: { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" },
  });
  mockedIdentity.mockReturnValue({
    tenantId: "tenant-a",
    dealerId: "dealer-a",
    organizationUnitId: "ou-a",
  });
}

function entitlement(decision?: { allowed: boolean; reason_code: string }) {
  mockedEntitlements.mockReturnValue({
    isLoading: false,
    error: null,
    data: { results: decision ? { [CAPABILITY]: decision } : {} },
  });
}

describe("dealer private inventory contract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readyDealer();
    mockedApiFetch.mockResolvedValue(jsonResponse({ vehicles: [] }));
  });

  test("fetchDealerInventory uses GET on the authenticated dealer-private route", async () => {
    await fetchDealerInventory("dealer-a");

    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
    const [route, init] = mockedApiFetch.mock.calls[0] as [string, RequestInit | undefined];
    expect(route).toBe(PRIVATE_ROUTE);
    expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
    expect(init?.headers).toEqual({ Accept: "application/json" });
    expect(route).not.toBe(MARKETPLACE_ROUTE);
    expect(route).not.toContain("/marketplace/");
    expect(route).not.toContain("/search");
  });

  test("fetchDealerInventory preserves dealer_id in the exact private route contract", async () => {
    await fetchDealerInventory("dealer A/42");

    const [route] = mockedApiFetch.mock.calls[0] as [string];
    expect(route).toBe("/api/v1/autos/dealers/dealer%20A%2F42/vehicles");
  });

  /**
   * Antes este caso fijaba el texto "Inventario bloqueado: DEFAULT_DENY". Ese
   * codigo lo inventaba la pantalla con un `?? "DEFAULT_DENY"`: el backend no lo
   * habia dicho. Lo que vale del caso --que NO se pida el inventario-- se
   * conserva; lo que se afirma ahora es que se dice que falta la decision, sin
   * ponerle un codigo que nadie emitio.
   */
  test("does not fetch private inventory when autos.inventory.list is absent", async () => {
    entitlement();
    render(<DealerInventoryPage />, { wrapper: wrapper(testClient()) });

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent("No pudimos confirmar si tu usuario puede ver el inventario");
    expect(aviso.textContent ?? "").not.toContain("DEFAULT_DENY");
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  /**
   * Aqui DEFAULT_DENY SI lo dice el backend, asi que se muestra. La diferencia
   * con el caso anterior es justo la que el packet viene a marcar: mostrar un
   * codigo recibido no es lo mismo que fabricarlo.
   */
  test("does not fetch private inventory when autos.inventory.list is explicitly denied", async () => {
    entitlement({ allowed: false, reason_code: "DEFAULT_DENY" });
    render(<DealerInventoryPage />, { wrapper: wrapper(testClient()) });

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveAttribute("data-reason-code", "DEFAULT_DENY");
    expect(aviso).toHaveAttribute("data-allowed", "false");
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  test("fetches private inventory only when autos.inventory.list is explicitly allowed", async () => {
    entitlement({ allowed: true, reason_code: "ALLOWED" });
    render(<DealerInventoryPage />, { wrapper: wrapper(testClient()) });

    await waitFor(() => expect(mockedApiFetch).toHaveBeenCalledTimes(1));
    const [route, init] = mockedApiFetch.mock.calls[0] as [string, RequestInit | undefined];
    expect(route).toBe(PRIVATE_ROUTE);
    expect((init?.method ?? "GET").toUpperCase()).toBe("GET");
    expect(route).not.toContain("/marketplace/");
    expect(await screen.findByText("Todavía no hay vehículos cargados en este concesionario.")).toBeInTheDocument();
  });
  test("busca, filtra por estado y ordena la lista (auditoria Mapaal QA)", async () => {
    entitlement({ allowed: true, reason_code: "ALLOWED" });
    mockedApiFetch.mockResolvedValue(
      jsonResponse({
        vehicles: [
          { id: "a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible", plate: "AB123CD" },
          { id: "b", make: "Peugeot", model: "208", year: 2018, status: "draft", stock_number: "S-2" },
        ],
      }),
    );
    render(<DealerInventoryPage />, { wrapper: wrapper(testClient()) });
    const lista = await screen.findByTestId("inventario-lista");
    expect(lista).toHaveAttribute("data-cantidad", "2");
    expect(lista).toHaveTextContent("Estado: Borrador");
    expect(lista).toHaveTextContent("Dominio AB123CD");

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar/ }), { target: { value: "s-2" } });
    expect(screen.getByTestId("inventario-lista")).toHaveAttribute("data-cantidad", "1");
    expect(screen.getByTestId("inventario-lista")).toHaveTextContent("2018 Peugeot 208");

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar/ }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), { target: { value: "disponible" } });
    expect(screen.getByTestId("inventario-lista")).toHaveAttribute("data-cantidad", "1");

    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), { target: { value: "" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar por" }), { target: { value: "anio-asc" } });
    const titulos = within(screen.getByTestId("inventario-lista")).getAllByText(/^\d{4} /).map((n) => n.textContent);
    expect(titulos).toEqual(["2018 Peugeot 208", "2021 Toyota Hilux"]);

    fireEvent.change(screen.getByRole("searchbox", { name: /Buscar/ }), { target: { value: "ferrari" } });
    expect(screen.getByTestId("inventario-sin-resultados")).toBeInTheDocument();
  });

  test("los estados se ven en español llano; uno desconocido se muestra tal cual", async () => {
    entitlement({ allowed: true, reason_code: "ALLOWED" });
    mockedApiFetch.mockResolvedValue(
      jsonResponse({
        vehicles: [
          { id: "a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible" },
          { id: "b", make: "Peugeot", model: "208", year: 2018, status: "draft" },
          { id: "c", make: "Fiat", model: "Cronos", year: 2020, status: "en_transito" },
        ],
      }),
    );
    render(<DealerInventoryPage />, { wrapper: wrapper(testClient()) });
    const lista = await screen.findByTestId("inventario-lista");
    expect(lista).toHaveTextContent("Estado: Disponible");
    expect(lista).toHaveTextContent("Estado: Borrador");
    expect(lista).toHaveTextContent("Estado: en_transito");
    expect(lista.textContent ?? "").not.toMatch(/Estado: (draft|disponible|BORRADOR|DISPONIBLE)\b/);

    const opciones = within(screen.getByRole("combobox", { name: "Estado" }))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opciones).toEqual(["Todos", "Borrador", "Disponible", "en_transito"]);

    const pantalla = document.body.textContent ?? "";
    expect(pantalla).not.toMatch(/autoridad|capability|entitlement|reason_code/i);
  });
});
