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
import { buscarContactos } from "@/app/autos/dealer/contactos/contactos-api";

const listo = () => waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
function precioEIva() {
  fireEvent.change(screen.getByLabelText(/^Alícuota del IVA/), { target: { value: "21" } });
  fireEvent.change(screen.getByLabelText(/Precio de venta/), { target: { value: "500" } });
}
const postBody = () => JSON.parse(api.mock.calls.find(([, init]) => init?.method === "POST")?.[1]?.body ?? "null");

it("sin comprador ni forma de pago no envia y pide ambos", async () => {
  renderSale(); await listo(); precioEIva();
  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
  expect(await screen.findByText("Elige el comprador. Si no está en tus contactos, dalo de alta primero.")).toBeVisible();
  expect(screen.getByText("Elige la forma de pago.")).toBeVisible();
  expect(postBody()).toBeNull();
});

it.each([["Contado en efectivo", "cash"], ["Contado por banco o transferencia", "bank"], ["Queda a cobrar (financiado o cuenta corriente)", "pending"]])(
  "envia el comprador elegido y la forma de pago %s", async (etiqueta, metodo) => {
  renderSale(); await listo(); precioEIva();
  fireEvent.change(screen.getByLabelText(/Buscar comprador/), { target: { value: "Comprador" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  fireEvent.click(await screen.findByRole("button", { name: /Comprador Prueba · DNI 30111222/ }));
  expect(screen.getByTestId("venta-comprador-elegido")).toHaveTextContent("Comprador Prueba");
  fireEvent.click(screen.getByLabelText(etiqueta));
  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
  await screen.findByText("Venta registrada.");
  expect(postBody()).toMatchObject({ buyer_contact_id: "buyer-1", payment_method: metodo });
});

it("sin resultados ofrece dar de alta el contacto", async () => {
  (buscarContactos as jest.Mock).mockResolvedValueOnce([]);
  renderSale(); await listo();
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  expect(await screen.findByRole("link", { name: "Dar de alta un contacto" })).toHaveAttribute("href", "/autos/dealer/contactos");
});

it.each([
  ["BUYER_NOT_FOUND", "El comprador elegido ya no está en tus contactos. Elige otro."],
  ["SALE_PAYMENT_FX_REQUIRED", "Una venta en otra moneda cobrada al contado necesita el tipo de cambio: elige 'Queda a cobrar' y carga el cobro aparte."],
])("traduce %s del backend", async (code, message) => {
  failure = code; renderSale(); await listo(); precioEIva();
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  fireEvent.click(await screen.findByRole("button", { name: /Comprador Prueba/ }));
  fireEvent.click(screen.getByLabelText("Contado en efectivo"));
  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
  expect(await screen.findByText(message)).toBeVisible();
});
