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
jest.mock("@/app/autos/dealer/contactos/contactos-api", () => ({
  buscarContactos: jest.fn(async () => [{ id: "buyer-1", display_name: "Comprador Prueba", dni: "30111222", cuit: null, deactivated_at: null }]),
}));
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
async function elegirCompradorYPago() {
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  fireEvent.click(await screen.findByRole("button", { name: /Comprador Prueba/ }));
  fireEvent.click(screen.getByLabelText("Contado por banco o transferencia"));
}
async function submit() {
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
  await elegirCompradorYPago();
  fireEvent.change(screen.getByLabelText(/Precio de venta/), { target: { value: "500" } });
  fireEvent.change(screen.getByLabelText(/Fecha y hora/), { target: { value: "2026-11-25T12:00" } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
}
it("AR sin alicuota no envia", async () => {
  renderSale(); await submit();
  expect(await screen.findByText("Indica la alícuota del IVA de la venta (por ejemplo 21, 10,5 o 0).")).toBeVisible();
  expect(api.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
});
it("DO prevalece sobre branding AR, muestra ITBIS 18 fijo y envia vat sin vat_base", async () => {
  country = "DO"; renderSale();
  await waitFor(() => expect(screen.getByLabelText(/^ITBIS/)).toHaveValue("18"));
  expect(screen.getByLabelText(/^ITBIS/)).toHaveAttribute("readonly");
  expect(screen.getByText("En República Dominicana el ITBIS de la venta de un vehículo es 18 %. Va sobre el precio total en inventario propio y sobre la comisión en consignados.")).toBeVisible();
  await submit(); await screen.findByText("Venta registrada.");
  const body = JSON.parse(api.mock.calls.find(([, init]) => init?.method === "POST")[1].body);
  expect(body.vat).toEqual({ rate: "18" });
  expect(body).not.toHaveProperty("vat_base");
});
it.each([
 ["SALE_VAT_RATE_REQUIRED", "Falta la alícuota del IVA (o el ITBIS)."],
 ["SALE_VAT_RATE_INVALID", "En República Dominicana el ITBIS es 18."],
 ["SALE_VAT_BASE_UNKNOWN", "La compra no tiene datos fiscales: complétalos antes de vender."],
])("traduce %s", async (code, message) => {
  failure = code; renderSale();
  fireEvent.change(screen.getByLabelText(/^Alícuota del IVA/), { target: { value: "21" } });
  await submit(); expect(await screen.findByText(message)).toBeVisible();
});
it("sin pais de compra usa la configuracion regional existente", async () => {
  country = null; renderSale(); await submit();
  expect(await screen.findByText("Indica la alícuota del IVA de la venta (por ejemplo 21, 10,5 o 0).")).toBeVisible();
});

it("en RD la ayuda de la base del ITBIS no habla de la diferencia por compra a particular", async () => {
  country = "DO"; renderSale();
  expect(await screen.findByText(/sobre el precio total en inventario propio \(aunque se haya comprado a una persona física\)/)).toBeVisible();
  expect(screen.queryByText(/comprado a un particular/)).toBeNull();
});
it("en AR la ayuda de la base del IVA sigue igual", async () => {
  renderSale();
  expect(await screen.findByText(/comprado a un particular/)).toBeVisible();
});
