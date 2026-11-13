import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { CompraRegistrada } from "@/app/autos/dealer/inventario/[vehicleId]/CompraRegistrada";
import { apiFetch } from "@/lib/api/fetch-client";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/access/client", () => ({ ...jest.requireActual("@/lib/access/client"), getAccessClientContext: () => ({ tenantId: "t" }) }));
const compra = { acquisition: { mode: "stock_inicial", acquired_on: "2026-11-01", country_code: "AR", seller_contact_id: "c1", fx: { rate: "1200.123456", source: "otra", detail: "Acuerdo", as_of: "2026-11-01T00:00:00Z" } }, cost: { amount: "100", paid_total: "100", currency: "ARS" }, payments: [{ id: "p1", method: "cheque", amount: "100", currency: "ARS", check_number: "123", check_bank: "Banco", check_cash_date: "2026-12-01", voided: false }] };
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CompraRegistrada vehicleId="v1" /></QueryClientProvider>); }
beforeEach(() => jest.clearAllMocks());
test("compra, pagos, FX y vendedor vienen de contratos reales, sin inventar motor ni margen", async () => {
  (apiFetch as jest.Mock).mockImplementation(async (path: string) => response(path.includes("/contacts/") ? { display_name: "Ana", dni: "*****678", cuit: null } : compra));
  mount();
  await screen.findByRole("region", { name: "Compra registrada" });
  expect(screen.getByText("Fecha: 01/11/2026")).toBeInTheDocument();
  expect(screen.getByText(/1200.123456/)).toHaveTextContent("Acuerdo");
  expect(screen.getByText(/Cobro 01\/12\/2026/)).toBeInTheDocument();
  await screen.findByText("DNI: *****678");
  expect(screen.queryByText(/Número de motor|margen/i)).not.toBeInTheDocument();
  expect((apiFetch as jest.Mock).mock.calls.map((c) => c[0])).toEqual(["/api/v1/autos/vehicles/v1/purchase", "/api/v1/autos/contacts/c1"]);
});
test("solo pinta motor cuando el servidor lo incluye", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(response({ ...compra, acquisition: { ...compra.acquisition, seller_contact_id: null }, engine_number: "MOTOR-1" }));
  mount(); await screen.findByText("Número de motor: MOTOR-1");
});
test("403 no deja sección de compra ni costo ni consulta de PII", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(response({ detail: { reason_code: "CAPABILITY_DENIED" } }, 403));
  const { container } = render(<QueryClientProvider client={new QueryClient()}><CompraRegistrada vehicleId="v1" /></QueryClientProvider>);
  await screen.findByRole("status");
  const { waitFor } = await import("@testing-library/react");
  await waitFor(() => expect(container).toBeEmptyDOMElement());
  expect(apiFetch).toHaveBeenCalledTimes(1);
});
test("500 muestra error sin datos falsos ni reintentos", async () => {
  (apiFetch as jest.Mock).mockResolvedValue(response({}, 500)); mount(); await screen.findByRole("alert"); expect(apiFetch).toHaveBeenCalledTimes(1);
});
