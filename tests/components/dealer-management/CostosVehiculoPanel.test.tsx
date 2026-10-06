/**
 * Panel de costos de un vehiculo: total por moneda y alta.
 *
 * Se mockea `apiFetch`, no el cliente del modulo, porque lo que hay que probar
 * es el cuerpo REAL que sale por la red y la RUTA a la que sale. Un mock del
 * cliente taparia justo los dos defectos que la auditoria encontro: `cost_type`
 * en espanol, y una reparacion enviada por /costs.
 *
 * El cierre por capability se mide en el packet de la pagina.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CostosVehiculoPanel } from "@/app/autos/dealer/finanzas/CostosVehiculoPanel";
import { localeDeTenant } from "@/lib/dealer-management/formato";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const ARGENTINA = localeDeTenant({ locale: "es-AR", currency: "ARS" });
const SIN_MONEDA = localeDeTenant({ locale: "es-AR", currency: null });

function montar(locale = ARGENTINA) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CostosVehiculoPanel vehicleId="veh-1" tenantId="tenant-a" locale={locale} />
    </QueryClientProvider>,
  );
}

function respondeTotales(body: unknown) {
  fetchMock.mockImplementation(async (path: string) => {
    if (path.endsWith("/costs/total")) {
      return { ok: true, status: 200, json: async () => body } as unknown as Response;
    }
    return { ok: true, status: 201, json: async () => ({ id: "cost-1" }) } as unknown as Response;
  });
}

function eligeTipo(value: string) {
  fireEvent.change(screen.getByRole("combobox", { name: /Tipo de costo/ }), { target: { value } });
}

function rellena(monto: string, fecha = "2026-09-30") {
  fireEvent.change(screen.getByRole("textbox", { name: /Monto/ }), { target: { value: monto } });
  fireEvent.change(screen.getByLabelText(/Fecha/), { target: { value: fecha } });
}

beforeEach(() => {
  fetchMock.mockReset();
  respondeTotales([]);
});

describe("total por moneda", () => {
  it("formatea el total con la moneda del tenant", async () => {
    respondeTotales([{ currency: "ARS", total_cost: "125000.50" }]);
    montar();
    const valor = await screen.findByTestId("costos-total-valor");
    expect(valor.textContent).toContain("125.000,50");
    expect(valor.textContent).not.toContain("RD$");
  });

  it("sin asientos muestra cero en la moneda del tenant, no un error", async () => {
    montar();
    expect((await screen.findByTestId("costos-total-valor")).textContent).toContain("0,00");
    expect(screen.queryByTestId("costos-total-error")).toBeNull();
  });
  it("las otras monedas se listan aparte y se dice que no se suman", async () => {
    respondeTotales([{ currency: "ARS", total_cost: "100" }, { currency: "USD", total_cost: "7" }]);
    montar();
    const otras = await screen.findByTestId("costos-otras-monedas");
    expect(otras).toHaveTextContent("no se suman");
    expect(otras.textContent).toContain("7,00");
  });

  it("sin moneda del tenant no se inventa una para el total", async () => {
    montar(SIN_MONEDA);
    expect(await screen.findByTestId("costos-sin-moneda")).toBeInTheDocument();
    expect(screen.queryByTestId("costos-total-valor")).toBeNull();
  });

  it("un 403 del total se ve con su reason_code", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ reason_code: "DEFAULT_DENY" }),
    } as unknown as Response);
    montar();
    expect(await screen.findByTestId("costos-total-error")).toHaveAttribute("data-reason-code", "DEFAULT_DENY");
  });

  it("dice que el detalle asiento por asiento no tiene endpoint", async () => {
    montar();
    expect(await screen.findByText(/GET \/api\/v1\/autos\/vehicles\/\{vehicle_id\}\/costs/)).toBeInTheDocument();
  });
});

describe("alta de un costo normal", () => {
  it("la moneda es la del tenant y no se puede editar", async () => {
    montar();
    expect(await screen.findByTestId("costo-moneda")).toHaveTextContent("ARS");
  });

  it("sin monto ni fecha no sale ningun POST", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    fetchMock.mockClear();
    fireEvent.submit(screen.getByTestId("costo-alta-form"));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("El monto es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("La fecha es obligatoria.")).toBeInTheDocument();
  });

  it("una compra va por /costs con el codigo del CHECK, no la etiqueta", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    rellena("125000.50");
    fetchMock.mockClear();
    respondeTotales([]);
    fireEvent.submit(screen.getByTestId("costo-alta-form"));

    await waitFor(() => expect(screen.getByTestId("costo-alta-ack")).toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/v1/autos/vehicles/veh-1/costs");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      cost_type: "purchase",
      amount: "125000.50",
      currency: "ARS",
      incurred_at: "2026-09-30T00:00:00Z",
    });
  });

  it("tildar saldo inicial envia is_opening=true y avisa de 3020", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    expect(screen.getByTestId("costo-saldo-inicial")).toHaveTextContent("3020");
    rellena("125000.50");
    fireEvent.click(screen.getByRole("checkbox", { name: /Saldo inicial/ }));
    fetchMock.mockClear();
    respondeTotales([]);
    fireEvent.submit(screen.getByTestId("costo-alta-form"));
    await waitFor(() => expect(screen.getByTestId("costo-alta-ack")).toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ cost_type: "purchase", is_opening: true });
  });

  it("en una reparacion no se ofrece saldo inicial", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    expect(screen.queryByTestId("costo-saldo-inicial")).toBeNull();
  });

  it("un 403 del POST se ve con su reason_code", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    rellena("10");
    fetchMock.mockImplementation(async (path: string) =>
      (path.endsWith("/costs/total")
        ? { ok: true, status: 200, json: async () => [] }
        : { ok: false, status: 403, json: async () => ({ reason_code: "DEFAULT_DENY" }) }) as unknown as Response,
    );
    fireEvent.submit(screen.getByTestId("costo-alta-form"));
    await waitFor(() =>
      expect(screen.getByTestId("costo-alta-error")).toHaveAttribute("data-reason-code", "DEFAULT_DENY"),
    );
  });
});

describe("reparacion", () => {
  it("los tres campos solo aparecen al elegir Reparacion", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    expect(screen.queryByTestId("costo-reparacion")).toBeNull();

    eligeTipo("repair");
    expect(screen.getByTestId("costo-reparacion")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Proveedor/ })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: /N\.º de factura/ })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: /document_id/ })).toBeEnabled();
  });

  it("sin proveedor, factura o documento no sale a la red", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    rellena("10");
    fetchMock.mockClear();
    fireEvent.submit(screen.getByTestId("costo-alta-form"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("El proveedor es obligatorio en una reparación.")).toBeInTheDocument();
    expect(screen.getByText(/el backend exige document_id/)).toBeInTheDocument();
  });

  it("completa, va por /repair-invoices con los tres identificadores", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    rellena("1000");
    fireEvent.change(screen.getByRole("textbox", { name: /Proveedor/ }), { target: { value: "Taller Sur" } });
    fireEvent.change(screen.getByRole("textbox", { name: /N\.º de factura/ }), { target: { value: "A-1" } });
    fireEvent.change(screen.getByRole("textbox", { name: /document_id/ }), { target: { value: "doc-1" } });
    fetchMock.mockClear();
    respondeTotales([]);
    fireEvent.submit(screen.getByTestId("costo-alta-form"));

    await waitFor(() => expect(screen.getByTestId("costo-alta-ack")).toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post?.[0]).toBe("/api/v1/autos/vehicles/veh-1/repair-invoices");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      amount: "1000",
      currency: "ARS",
      incurred_at: "2026-09-30T00:00:00Z",
      supplier_name: "Taller Sur",
      invoice_number: "A-1",
      document_id: "doc-1",
    });
  });
});
