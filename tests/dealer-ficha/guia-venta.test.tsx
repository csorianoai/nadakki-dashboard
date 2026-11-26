/** @jest-environment jsdom */
// "Registrar la venta": los pasos avanzan con el formulario; al registrar, cierre con lo que sigue y aviso de progreso.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SalePage from "@/app/autos/dealer/inventario/[vehicleId]/vender/page";
import { apiFetch } from "@/lib/api/fetch-client";
import { EVENTO_PROGRESO } from "@/lib/dealer/pasos-tarea";

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
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
let avisos: string[];
const oir = (e: Event) => avisos.push((e as CustomEvent).detail.motivo);

beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path, init) => {
    if (String(path).endsWith("/purchase")) return response({ cost: { amount: "100", currency: "ARS" }, acquisition: { country_code: "AR" } });
    if (init?.method === "POST") return response({});
    throw new Error("Ruta inesperada");
  });
  avisos = [];
  window.addEventListener(EVENTO_PROGRESO, oir);
});
afterEach(() => window.removeEventListener(EVENTO_PROGRESO, oir));

const guia = () => screen.getByRole("region", { name: "Registrar la venta" });
const titulo = () => within(guia()).getByRole("heading").textContent;
const siguienteAqui = () => within(guia()).getByTestId("paso-siguiente-aqui").textContent;

test("la guia avanza paso a paso y al registrar muestra el cierre y lo que sigue", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><SalePage /></QueryClientProvider>);
  await waitFor(() => expect(screen.getByRole("button", { name: "Registrar venta" })).toBeEnabled());
  // La fecha llega precargada con la hora actual; falta el precio.
  expect(titulo()).toBe("Registrar la venta: 0 de 5");
  expect(siguienteAqui()).toMatch(/Precio y fecha de la venta, en esta pantalla/);
  expect(within(guia()).getByTestId("paso-comision")).toHaveTextContent("(opcional)");

  fireEvent.change(screen.getByLabelText(/Precio de venta/), { target: { value: "500" } });
  expect(titulo()).toBe("Registrar la venta: 1 de 5");
  expect(siguienteAqui()).toMatch(/Elegir el comprador/);

  fireEvent.change(screen.getByLabelText(/Buscar comprador/), { target: { value: "Comprador" } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
  fireEvent.click(await screen.findByRole("button", { name: /Comprador Prueba · DNI 30111222/ }));
  expect(titulo()).toBe("Registrar la venta: 2 de 5");
  expect(siguienteAqui()).toMatch(/Forma de pago/);

  fireEvent.click(screen.getByLabelText("Contado en efectivo"));
  expect(siguienteAqui()).toMatch(/IVA y permuta/);

  // En Argentina la alicuota es obligatoria: con ella el paso fiscal queda hecho.
  fireEvent.change(screen.getByLabelText(/^Alícuota del IVA/), { target: { value: "21" } });
  expect(titulo()).toBe("Registrar la venta: 4 de 5");
  expect(siguienteAqui()).toMatch(/Confirmar con Registrar venta/);
  expect(avisos).toEqual([]);

  fireEvent.click(screen.getByRole("button", { name: "Registrar venta" }));
  await screen.findByText("Venta registrada.");
  expect(titulo()).toBe("Registrar la venta: 5 de 5");
  expect(within(guia()).getByTestId("pasos-completos")).toHaveTextContent("la venta quedó registrada");
  expect(avisos).toEqual(["venta"]);
  const sigue = screen.getByRole("navigation", { name: "Qué sigue después de la venta" });
  expect(within(sigue).getByRole("link", { name: "Cargar la comisión del vendedor" })).toHaveAttribute(
    "href", "/autos/dealer/inventario/vehicle-1#comisiones");
  expect(within(sigue).getByRole("link", { name: /contabilidad/ })).toHaveAttribute("href", "/contable/libro-mayor");
  expect(within(sigue).getByRole("link", { name: "Volver al inventario" })).toHaveAttribute("href", "/autos/dealer/inventario");
});
