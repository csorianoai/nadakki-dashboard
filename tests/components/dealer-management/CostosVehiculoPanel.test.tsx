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
    if (path.endsWith("/documents")) {
      return { ok: true, status: 201, json: async () => ({ id: "doc-1", doc_type: "repair_invoice" }) } as unknown as Response;
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

  it("dice que el detalle todavia no esta, sin rutas de API a la vista", async () => {
    montar();
    expect(await screen.findByText(/el detalle de cada costo todavía no está disponible/)).toBeInTheDocument();
    expect(screen.getByTestId("costos-total").textContent).not.toMatch(/\/api\/|GET |reason_code/);
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

  it("saldo inicial es una casilla deshabilitada que avisa que iria a 2010, y no envia is_opening", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    const aviso = screen.getByTestId("costo-saldo-inicial");
    expect(aviso).toHaveTextContent("no acepta este dato");
    expect(aviso).not.toHaveTextContent("va contra 3020");
    const casilla = screen.getByRole("checkbox", { name: /Saldo inicial/ });
    expect(casilla).toBeDisabled();
    expect(casilla).not.toBeChecked();
    rellena("125000.50");
    fetchMock.mockClear();
    respondeTotales([]);
    fireEvent.submit(screen.getByTestId("costo-alta-form"));
    await waitFor(() => expect(screen.getByTestId("costo-alta-ack")).toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body))).not.toHaveProperty("is_opening");
  });

  it("en una reparacion no se ofrece saldo inicial", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    expect(screen.queryByTestId("costo-saldo-inicial")).not.toBeInTheDocument();
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
    // "Subir factura" es un archivo, no un id que el dealer tenga que conocer.
    expect(screen.queryByRole("textbox", { name: /document_id/ })).toBeNull();
    expect(screen.getByLabelText(/Subir factura/)).toHaveAttribute("type", "file");
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
    expect(screen.getByText("Subí la factura de la reparación.")).toBeInTheDocument();
  });

  it("completa, va por /repair-invoices con los tres identificadores", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    rellena("1000");
    fireEvent.change(screen.getByRole("textbox", { name: /Proveedor/ }), { target: { value: "Taller Sur" } });
    fireEvent.change(screen.getByRole("textbox", { name: /N\.º de factura/ }), { target: { value: "A-1" } });
    const pdf = new File(["%PDF"], "factura.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Subir factura/), { target: { files: [pdf] } });
    expect(await screen.findByText("Factura subida: factura.pdf")).toBeInTheDocument();
    const subida = fetchMock.mock.calls.find(([path]) => String(path).endsWith("/documents"));
    expect(subida?.[0]).toBe("/api/v1/autos/vehicles/veh-1/documents");
    const multipart = subida?.[1]?.body as FormData;
    expect(multipart.get("doc_type")).toBe("repair_invoice");
    expect((multipart.get("file") as File).name).toBe("factura.pdf");
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

describe("confirmacion del alta", () => {
  it("el total se relee ANTES de confirmar y la confirmacion lo dice", async () => {
    montar();
    await screen.findByTestId("costos-total-valor");
    eligeTipo("transport");
    rellena("1500,50");
    fetchMock.mockClear();
    respondeTotales([{ currency: "ARS", total_cost: "1500.50" }]);
    fireEvent.submit(screen.getByTestId("costo-alta-form"));

    expect(await screen.findByTestId("costo-alta-ack")).toHaveTextContent(/^Costo registrado\.$/);
    const rutas = fetchMock.mock.calls.map(([path]) => String(path));
    const post = rutas.findIndex((p) => p.endsWith("/costs"));
    expect(post).toBeGreaterThanOrEqual(0);
    expect(rutas.slice(post + 1).some((p) => p.endsWith("/costs/total"))).toBe(true);
    expect(screen.getByTestId("costos-total-valor").textContent).toContain("1.500,50");
    expect(screen.getByTestId("costos-total-actualizado")).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls[post][1]?.body)).amount).toBe("1500.50");
  });

  it("un error se dice en castellano; el codigo queda aparte", async () => {
    montar();
    await screen.findByTestId("costos-total-valor");
    eligeTipo("transport");
    rellena("10");
    fetchMock.mockImplementation(async (path: string) =>
      path.endsWith("/costs/total")
        ? ({ ok: true, status: 200, json: async () => [] } as unknown as Response)
        : ({ ok: false, status: 500, json: async () => ({}) } as unknown as Response),
    );
    fireEvent.submit(screen.getByTestId("costo-alta-form"));
    const error = await screen.findByTestId("costo-alta-error");
    expect(error).toHaveTextContent("No se pudo registrar el costo. El servicio no respondió.");
    expect(error).toHaveTextContent("Código para soporte: HTTP_500");
    expect(screen.queryByTestId("costo-alta-ack")).toBeNull();
  });

  it("una factura de mas de 10 MB no se sube y se dice por que", async () => {
    montar();
    await screen.findByTestId("costo-alta-form");
    eligeTipo("repair");
    const grande = new File(["x"], "grande.pdf", { type: "application/pdf" });
    Object.defineProperty(grande, "size", { value: 11 * 1024 * 1024 });
    fetchMock.mockClear();
    fireEvent.change(screen.getByLabelText(/Subir factura/), { target: { files: [grande] } });
    expect(await screen.findByText(/El archivo pesa más de 10 MB/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([path]) => String(path).endsWith("/documents"))).toBe(false);
  });

  it("el formulario no usa la validacion nativa del navegador", async () => {
    montar();
    expect(await screen.findByTestId("costo-alta-form")).toHaveAttribute("novalidate");
  });
});
