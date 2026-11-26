import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EstudioGenioCompras, navegador } from "@/components/legal/cases/EstudioGenioCompras";
import { apiFetch } from "@/lib/api/fetch-client";
import m from "@/messages/es/legal-estudio-genio.json";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const api = apiFetch as jest.Mock;
const c = m.compras;
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
let estado: Record<string, unknown>;
function renderCompras() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><EstudioGenioCompras tenantId="tenant-1" /></QueryClientProvider>);
}
const assign = jest.fn();
let search = "";
beforeEach(() => {
  assign.mockReset(); api.mockReset(); search = "";
  jest.spyOn(navegador, "url").mockReturnValue("https://dashboard.nadakki.com/legal/cases/c1/estudio-genio?pago=x");
  jest.spyOn(navegador, "search").mockImplementation(() => search);
  jest.spyOn(navegador, "ir").mockImplementation(assign);
  estado = { compras: [], saldo: { completo: { disponible: false, disponibles: 0, comprados: 0, usados: 0 }, esencial: { disponible: true, disponibles: 2, comprados: 3, usados: 1 } },
    precios_usd: { completo: 1500, esencial: 500 }, datos_transferencia: "Banco X · cuenta 000", metodos_disponibles: ["stripe", "transferencia"] };
  api.mockImplementation(async (path: string, init?: { method?: string; body?: string }) => {
    if (init?.method === "POST" && path.endsWith("/verificar")) return response({ compra_id: "c1", estado: "confirmada" });
    if (init?.method === "POST") {
      const b = JSON.parse(init.body ?? "{}");
      return response(b.metodo === "stripe" ? { compra_id: "c1", estado: "pendiente", url_pago: "https://checkout.stripe.com/x" } : { compra_id: "c2", estado: "pendiente" }, 201);
    }
    return response(estado);
  });
});
it("muestra el saldo por paquete", async () => {
  renderCompras();
  expect(await screen.findByText(/2 disponibles/)).toBeVisible();
  expect(screen.getByText(new RegExp(c.sinSaldo))).toBeVisible();
});
it("tarjeta: envia url_retorno sin parametros y redirige a Stripe", async () => {
  renderCompras(); fireEvent.click(await screen.findByRole("button", { name: c.comprar }));
  fireEvent.change(screen.getByLabelText(c.cantidad), { target: { value: "2" } });
  expect(screen.getByText(`${c.total}: US$1.000`)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: c.pagar }));
  await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/x"));
  const post = api.mock.calls.find(([, i]) => i?.method === "POST");
  expect(JSON.parse(post[1].body)).toEqual({ paquete: "esencial", cantidad: 2, metodo: "stripe", url_retorno: "https://dashboard.nadakki.com/legal/cases/c1/estudio-genio" });
});
it("transferencia: muestra los datos y no envia sin referencia", async () => {
  renderCompras(); fireEvent.click(await screen.findByRole("button", { name: c.comprar }));
  fireEvent.click(screen.getByLabelText(c.transferencia));
  expect(screen.getByText("Banco X · cuenta 000")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: c.registrar }));
  expect(screen.getByRole("alert")).toHaveTextContent(c.referenciaFalta);
  expect(api.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  fireEvent.change(screen.getByLabelText(c.referencia), { target: { value: "TRF-77" } });
  fireEvent.click(screen.getByRole("button", { name: c.registrar }));
  expect(await screen.findByText(c.recibida)).toBeVisible();
});
it("sin datos bancarios solo ofrece tarjeta; sin metodos lo dice", async () => {
  estado = { ...estado, metodos_disponibles: ["stripe"] };
  const r = renderCompras(); fireEvent.click(await screen.findByRole("button", { name: c.comprar }));
  expect(screen.queryByLabelText(c.transferencia)).toBeNull(); r.unmount();
  estado = { ...estado, metodos_disponibles: [] };
  renderCompras(); fireEvent.click(await screen.findByRole("button", { name: c.comprar }));
  expect(screen.getByText(c.sinMetodos)).toBeVisible();
});
it("al volver de Stripe verifica la compra", async () => {
  search = "?compra=c1&pago=ok";
  renderCompras();
  expect(await screen.findByText(c.pagoOk)).toBeVisible();
  expect(api).toHaveBeenCalledWith("/api/legal/cases/estudio-genio/compras/c1/verificar", expect.objectContaining({ method: "POST" }));
});
