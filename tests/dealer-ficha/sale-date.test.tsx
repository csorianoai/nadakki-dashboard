import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SalePage from "@/app/autos/dealer/inventario/[vehicleId]/vender/page";
import { apiFetch } from "@/lib/api/fetch-client";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "vehicle-1" }) }));
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/client", () => {
  const actual = jest.requireActual("@/lib/access/client");
  return { ...actual, getAccessClientContext: () => ({ tenantId: "tenant-1", dealerId: "dealer-1" }) };
});
jest.mock("@/lib/access/hooks", () => ({ useAccessEntitlementsBatch: () => ({ data: { results: { "autos.inventory.create": { allowed: true } } } }) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }) }));
const api = apiFetch as jest.Mock;
let country: string | null;
let failure: string | null;
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
beforeEach(() => {
  country = "AR"; failure = null; api.mockReset();
  api.mockImplementation(async (path, init) => {
    if (String(path).endsWith("/purchase")) return response({ cost: { amount: "100", currency: "ARS" }, acquisition: { country_code: country } });
    if (init?.method === "POST") return failure ? response({ detail: { reason_code: failure } }, 422) : response({});
    throw new Error("Ruta inesperada");
  });
});
function renderSale() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><SalePage /></QueryClientProvider>);
}
import { ahoraLocal, validateSaleForm, SALE_DATE_FUTURE_MESSAGE } from "@/lib/dealer-management/vehicle-sale";

function llenarYEnviar(fecha?: string) {
  fireEvent.change(screen.getByLabelText(/^Alícuota del IVA/), { target: { value: "21" } });
  fireEvent.change(screen.getByLabelText(/Precio de venta/), { target: { value: "500" } });
  if (fecha !== undefined) fireEvent.change(screen.getByLabelText(/Fecha y hora/), { target: { value: fecha } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
}

it("el campo de fecha viene con la hora actual y no deja elegir el futuro", async () => {
  renderSale();
  const campo = screen.getByLabelText(/Fecha y hora/) as HTMLInputElement;
  const ahora = Date.now();
  expect(Math.abs(Date.parse(campo.value) - ahora)).toBeLessThan(2 * 60_000);
  expect(campo.max).toBeTruthy();
});

it("una hora futura no se envia y muestra el aviso", async () => {
  renderSale();
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
  llenarYEnviar(ahoraLocal(new Date(Date.now() + 60 * 60_000)));
  // El navegador ya frena el envio por el atributo max; si igual llega al submit, lo frena nuestra validacion.
  fireEvent.submit(screen.getByTestId("venta-form"));
  expect(await screen.findByText(SALE_DATE_FUTURE_MESSAGE)).toBeVisible();
  expect(api.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
});

it("con la hora precargada la venta se envia", async () => {
  renderSale();
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
  llenarYEnviar();
  await screen.findByText("Venta registrada.");
});

it.each([
  ["SALE_DATE_IN_FUTURE", "La fecha y hora de la venta no puede ser posterior a ahora."],
  ["VEHICLE_ALREADY_SOLD", "Este vehículo ya está vendido."],
])("traduce %s del backend", async (code, message) => {
  failure = code; renderSale();
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
  llenarYEnviar();
  expect(await screen.findByText(message)).toBeVisible();
});

it("validateSaleForm rechaza solo lo que pasa de un minuto en el futuro", () => {
  const ahora = new Date("2026-11-25T22:37:00");
  const base = { sale_price_amount: "500" };
  expect(validateSaleForm({ ...base, sold_at: "2026-11-25T22:45" }, "ARS", ahora).sold_at).toBe(SALE_DATE_FUTURE_MESSAGE);
  expect(validateSaleForm({ ...base, sold_at: "2026-11-25T22:37" }, "ARS", ahora).sold_at).toBeUndefined();
});
