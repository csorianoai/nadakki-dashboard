/**
 * Pantalla de alta manual: el CIERRE y el ENVIO.
 *
 * Se renderiza `app/autos/dealer/inventario/nuevo/page.tsx`, no el formulario a
 * pelo: un formulario correcto detras de una puerta que concede sola no sirve de
 * nada. Los campos y la moneda se miden en el packet del formulario; aqui no se
 * repiten.
 *
 * `apiFetch` se mockea en vez del cliente del modulo porque lo que hay que
 * probar es el cuerpo REAL que sale por la red: un `price_rd` colado o un campo
 * que el contrato no acepta, un mock del cliente lo taparia.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import DealerInventoryPage from "@/app/autos/dealer/inventario/page";
import DealerVehicleNuevoPage from "@/app/autos/dealer/inventario/nuevo/page";
import { VEHICLE_WRITE_CAPABILITY } from "@/lib/dealer-management/vehicle-manual";

jest.mock("@/lib/dealer-management/inventory", () => ({
  fetchDealerInventory: jest.fn(async () => []),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
  usePathname: () => "/autos/dealer/inventario/nuevo",
}));

let branding: { locale?: string | null; currency?: string | null } | undefined;
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: branding, isPending: false, isLoading: false }),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

let resolution: unknown;
/**
 * La pagina del inventario ya NO decide por el contexto local: lo hace por el
 * batch (#562), y del contexto solo saca el `dealerId` con el que CONSTRUIR la
 * peticion, via `selectedDealerIdentity`. El mock tenia solo
 * `resolveDealerAccessContext`, asi que al rebasar sobre staging la pagina
 * llamaba a una funcion que el mock no exporta.
 */
let identidad: { tenantId: string; dealerId: string; organizationUnitId: string | null } | null = null;
jest.mock("@/lib/dealer/access-context", () => ({
  resolveDealerAccessContext: () => resolution,
  selectedDealerIdentity: () => identidad,
}));

/** El selector de varias asignaciones no se ejercita aqui: con binding escrito
 *  la pagina no pide la lista. Vive en tests/app/InventarioSelectorDealer. */
jest.mock("@/lib/dealer/dealer-context-api", () => ({
  ...jest.requireActual("@/lib/dealer/dealer-context-api"),
  fetchMyDealerContext: jest.fn(async () => []),
}));

jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const READY = {
  status: "ready",
  reason_code: null,
  context: { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" },
};

function batch(state: Partial<{ isLoading: boolean; error: unknown; allowed: boolean; reason: string }>) {
  return {
    isLoading: state.isLoading ?? false,
    isPending: state.isLoading ?? false,
    isError: Boolean(state.error),
    error: state.error ?? null,
    data: state.error
      ? undefined
      : {
          results: {
            [VEHICLE_WRITE_CAPABILITY]: {
              allowed: state.allowed ?? false,
              reason_code: state.reason ?? (state.allowed ? "ALLOWED" : "DEFAULT_DENY"),
              limit: null,
              current_usage: null,
            },
          },
        },
  };
}

function rellenaMinimo() {
  fireEvent.change(screen.getByRole("textbox", { name: /Marca/ }), { target: { value: "Toyota" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Modelo/ }), { target: { value: "Hilux" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Año/ }), { target: { value: "2021" } });
}

beforeEach(() => {
  push.mockReset();
  fetchMock.mockReset();
  batchMock.mockReset();
  branding = { locale: "es-AR", currency: "ARS" };
  resolution = READY;
  // Mismo dealer que READY: es el binding que el shell deja tras sincronizar.
  identidad = { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" };
  batchMock.mockReturnValue(batch({ allowed: true }));
});

describe("cierre antes del formulario", () => {
  it("sin contexto de dealer no pinta el formulario", () => {
    resolution = { status: "no_dealer", reason_code: "DEFAULT_DENY", tenantId: "tenant-a" };
    identidad = null;
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByTestId("vehicle-manual-form")).toBeNull();
    expect(screen.getByTestId("nuevo-sin-contexto")).toHaveTextContent("DEFAULT_DENY");
  });

  it("mientras el batch carga no pinta el formulario", () => {
    batchMock.mockReturnValue(batch({ isLoading: true }));
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByTestId("vehicle-manual-form")).toBeNull();
  });

  it("denegado muestra el reason_code del backend y ningun campo", () => {
    batchMock.mockReturnValue(batch({ allowed: false, reason: "UPGRADE_REQUIRED" }));
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByTestId("vehicle-manual-form")).toBeNull();
    expect(screen.getByTestId("nuevo-bloqueado")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
  });

  it("si el batch falla cierra en vez de conceder", () => {
    batchMock.mockReturnValue(batch({ error: new Error("red caida") }));
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByTestId("vehicle-manual-form")).toBeNull();
    expect(screen.getByTestId("nuevo-bloqueado")).toHaveAttribute("data-allowed", "false");
  });

  it("pide al batch exactamente la clave de escritura del catalogo", () => {
    render(<DealerVehicleNuevoPage />);
    expect(batchMock).toHaveBeenCalledWith([VEHICLE_WRITE_CAPABILITY]);
  });
});

describe("formulario concedido", () => {
  it("el formulario aparece y nace en BORRADOR", () => {
    render(<DealerVehicleNuevoPage />);
    expect(screen.getByTestId("vehicle-manual-form")).toBeInTheDocument();
    expect(screen.getByTestId("vehicle-status")).toHaveTextContent("BORRADOR");
  });
});

describe("envio", () => {
  it("sin marca ni modelo no sale ninguna peticion", () => {
    render(<DealerVehicleNuevoPage />);
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("La marca es obligatoria.")).toBeInTheDocument();
    expect(screen.getByText("El modelo es obligatorio.")).toBeInTheDocument();
  });

  it("un VIN de largo distinto de 17 se para antes de la red", () => {
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    fireEvent.change(screen.getByRole("textbox", { name: /VIN/ }), { target: { value: "ABC123" } });
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("El VIN tiene exactamente 17 caracteres.")).toBeInTheDocument();
  });

  it("envia solo campos del contrato y lleva a la ficha creada", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "veh-9" }) } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toEqual({ make: "Toyota", model: "Hilux", year: 2021, condition: "used" });
    expect(Object.keys(body)).not.toContain("price_rd");
    expect(Object.keys(body)).not.toContain("price_usd");
    expect((init?.headers as Record<string, string>)["X-Organization-Unit-ID"]).toBe("ou-a");
    expect(Object.keys(body)).not.toContain("status");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/autos/dealer/inventario/veh-9"));
  });

  it("un 403 del backend se ve en pantalla con su reason_code", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ reason_code: "UPGRADE_REQUIRED" }),
    } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

    await waitFor(() =>
      expect(screen.getByTestId("vehicle-manual-error")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("si el backend no devuelve id no se navega a una ficha inventada", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({}) } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

    await waitFor(() => expect(screen.getByTestId("vehicle-manual-ack")).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });
});

describe("entrada desde el inventario", () => {
  function lista(puedeCrear: boolean) {
    batchMock.mockReturnValue({
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
      data: {
        results: {
          "autos.inventory.list": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
          [VEHICLE_WRITE_CAPABILITY]: {
            allowed: puedeCrear,
            reason_code: puedeCrear ? "ALLOWED" : "UPGRADE_REQUIRED",
            limit: null,
            current_usage: null,
          },
        },
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={client}>
        <DealerInventoryPage />
      </QueryClientProvider>,
    );
  }

  it("con la clave de escritura ofrece la entrada al alta manual", () => {
    lista(true);
    expect(screen.getByTestId("inventario-nuevo")).toHaveAttribute("href", "/autos/dealer/inventario/nuevo");
  });

  it("sin la clave de escritura no pinta la entrada", () => {
    lista(false);
    expect(screen.queryByTestId("inventario-nuevo")).toBeNull();
  });

  it("sin binding de dealer no pinta la entrada: /nuevo estaria cerrada", () => {
    identidad = null;
    lista(true);
    expect(screen.queryByTestId("inventario-nuevo")).toBeNull();
  });
});

/**
 * El caso de Mapaal: dealer SIN unidad organizativa. La lista pinta el CTA, asi
 * que la pantalla tiene que abrir y el POST salir sin inventar una unidad.
 */
describe("dealer sin unidad organizativa", () => {
  beforeEach(() => {
    resolution = {
      status: "no_organization_unit",
      reason_code: "NO_ORGANIZATION_UNIT",
      tenantId: "tenant-a",
      dealerId: "dealer-a",
      organizationUnitId: null,
    };
    identidad = { tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: null };
  });

  it("la lista ofrece la entrada y la pantalla pinta el formulario", () => {
    batchMock.mockReturnValue({
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
      data: {
        results: {
          "autos.inventory.list": { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
          [VEHICLE_WRITE_CAPABILITY]: { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null },
        },
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <DealerInventoryPage />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("inventario-nuevo")).toBeInTheDocument();
    unmount();

    batchMock.mockReturnValue(batch({ allowed: true }));
    render(<DealerVehicleNuevoPage />);
    expect(screen.queryByTestId("nuevo-sin-contexto")).toBeNull();
    expect(screen.getByTestId("vehicle-manual-form")).toBeInTheDocument();
  });

  it("el POST sale sin cabecera de unidad y sin precios", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: "veh-1" }) } as unknown as Response);
    render(<DealerVehicleNuevoPage />);
    rellenaMinimo();
    fireEvent.submit(screen.getByTestId("vehicle-manual-form"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/tenants/tenant-a/dealers/dealer-a/vehicles");
    const headers = init?.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("X-Organization-Unit-ID");
    expect(headers["X-Dealer-ID"]).toBe("dealer-a");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty("price_rd");
    expect(body).not.toHaveProperty("price_usd");
  });
});
