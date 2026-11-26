import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminEstudioGenioPage from "@/app/admin/estudio-genio/page";
import { apiFetch } from "@/lib/api/fetch-client";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "platform-ops" }) }));
const api = apiFetch as jest.Mock;
const res = (body: unknown, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(body) });
const compra = { compra_id: "c1", tenant_id: "t1", despacho: "qa", despacho_nombre: "Despacho QA", paquete: "esencial", cantidad: 1,
  monto_usd: 500, metodo: "transferencia", estado: "pendiente", referencia: "TRF-9", created_at: "2026-11-26T15:00:00Z" };
beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path: string, init?: { method?: string }) =>
    init?.method === "POST" ? res({ ...compra, estado: "confirmada" }) : res({ compras: [compra] }));
  jest.spyOn(window, "confirm").mockReturnValue(true);
});
it("lista las pendientes de todos los despachos y confirma con la ruta del despacho", async () => {
  render(<AdminEstudioGenioPage />);
  expect(await screen.findByText("Despacho QA")).toBeVisible();
  expect(screen.getByText("US$500")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
  await waitFor(() => expect(api).toHaveBeenCalledWith("/api/legal/cases/estudio-genio/compras/t1/c1/confirmar", expect.objectContaining({ method: "POST" })));
  expect(await screen.findByText(/el despacho ya tiene el saldo/)).toBeVisible();
});
it("rechazar exige motivo", async () => {
  render(<AdminEstudioGenioPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Rechazar" }));
  expect(screen.getByRole("alert")).toHaveTextContent("motivo");
  expect(api.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
});
it("en modo supervision explica que debe volver al despacho de Nadakki", async () => {
  api.mockImplementation(async (path: string, init?: { method?: string }) =>
    init?.method === "POST" ? res({ detail: "Vista de solo lectura" }, 403) : res({ compras: [compra] }));
  render(<AdminEstudioGenioPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("modo supervisión");
});
