/**
 * @jest-environment jsdom
 *
 * Pedido de Cesar (26-nov): cargar un auto por primera vez y registrar su venta muestran todos los pasos.
 * Cada `hecho` sale de los datos que la ficha ya lee; tras guardar se avisa el progreso.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import RegistrarPage from "@/app/autos/dealer/inventario/[vehicleId]/registrar/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";
import { EVENTO_PROGRESO, resumenPasos } from "@/lib/dealer/pasos-tarea";
import { despuesDeVender, pasosCargaAuto, pasosVenta, type DatosCargaAuto } from "@/lib/dealer/pasos-vehiculo";
import { pasarADisponible } from "@/lib/dealer-management/vehicle-edit";
import { postVehicleAcquisition } from "@/lib/dealer/vehicle-economics-write";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }),
}));
jest.mock("@/lib/dealer-management/vehicle-edit", () => {
  const actual = jest.requireActual("@/lib/dealer-management/vehicle-edit");
  return { ...actual, pasarADisponible: jest.fn(), guardarEdicion: jest.fn() };
});
jest.mock("@/lib/dealer/vehicle-economics-write", () => {
  const actual = jest.requireActual("@/lib/dealer/vehicle-economics-write");
  return { ...actual, postVehicleAcquisition: jest.fn(async () => ({ id: "acq-1" })) };
});

const BASE: DatosCargaAuto = {
  vehicleId: "veh-1", make: "Toyota", model: "Hilux", year: 2021, status: "draft",
  price_amount: null, compraRegistrada: false, fotos: 0, verCostos: true,
};
const siguiente = (d: Partial<DatosCargaAuto>) => resumenPasos(pasosCargaAuto({ ...BASE, ...d }) ?? []).siguiente;

describe("pasos para cargar un auto", () => {
  test("cada paso se marca con su dato y el siguiente apunta a donde se hace", () => {
    expect(siguiente({})).toMatchObject({ id: "compra", enlace: "/autos/dealer/inventario/veh-1/registrar" });
    expect(siguiente({ compraRegistrada: true })).toMatchObject({ id: "fotos", enlace: "#fotos" });
    expect(siguiente({ compraRegistrada: true, fotos: 3 })).toMatchObject({ id: "precio", enlace: "#precio" });
    expect(siguiente({ compraRegistrada: true, fotos: 3, price_amount: "100" })).toMatchObject({ id: "publicar", enlace: "#precio" });
    expect(siguiente({ compraRegistrada: true, fotos: 3, price_amount: "100", status: "disponible" })).toMatchObject({
      id: "vender", enlace: "/autos/dealer/inventario/veh-1/vender",
    });
  });

  test("vendido: el ciclo se cierra; sin plan de fotos o sin ver costos esos pasos no cuentan", () => {
    expect(pasosCargaAuto({ ...BASE, status: "vendido" })).toBeNull();
    const pasos = pasosCargaAuto({ ...BASE, fotos: null, verCostos: false }) ?? [];
    expect(pasos.find((p) => p.id === "fotos")).toMatchObject({ opcional: true });
    expect(pasos.some((p) => p.id === "costos")).toBe(false);
    expect(pasosCargaAuto({ ...BASE, status: "archivado" })).not.toBeNull();
  });

  test("vender esta siempre: pendiente y sin enlace hasta publicar, asi el total no cambia", () => {
    const borrador = pasosCargaAuto({ ...BASE, compraRegistrada: true, fotos: 3, price_amount: "100" }) ?? [];
    const vender = borrador.find((p) => p.id === "vender");
    expect(vender).toMatchObject({ hecho: false, ayuda: "Primero pasalo a Disponible." });
    expect(vender?.enlace).toBeUndefined();
    expect(borrador[borrador.length - 1]?.id).toBe("vender");
    const publicado = pasosCargaAuto({ ...BASE, compraRegistrada: true, fotos: 3, price_amount: "100", status: "disponible" }) ?? [];
    expect(resumenPasos(publicado).total).toBe(resumenPasos(borrador).total);
    for (const extra of [{}, { fotos: null, verCostos: false }]) {
      const antes = pasosCargaAuto({ ...BASE, ...extra }) ?? [];
      const despues = pasosCargaAuto({ ...BASE, ...extra, status: "disponible" }) ?? [];
      expect(resumenPasos(despues).total).toBe(resumenPasos(antes).total);
      expect(despues.map((p) => p.id)).toEqual(antes.map((p) => p.id));
    }
  });
});

describe("pasos para registrar la venta", () => {
  const nada = { precioYFecha: false, comprador: false, formaDePago: false, fiscal: false, impuesto: "IVA" as const, registrada: false };
  test("avanzan en orden y la comision no bloquea", () => {
    expect(resumenPasos(pasosVenta(nada))).toMatchObject({ hechos: 0, total: 5, siguiente: { id: "precio" } });
    expect(resumenPasos(pasosVenta({ ...nada, precioYFecha: true })).siguiente?.id).toBe("comprador");
    expect(resumenPasos(pasosVenta({ ...nada, precioYFecha: true, comprador: true })).siguiente?.id).toBe("pago");
    expect(resumenPasos(pasosVenta({ ...nada, precioYFecha: true, comprador: true, formaDePago: true })).siguiente?.id).toBe("fiscal");
    expect(resumenPasos(pasosVenta({ ...nada, precioYFecha: true, comprador: true, formaDePago: true, fiscal: true })).siguiente?.id).toBe("confirmar");
    expect(resumenPasos(pasosVenta({ ...nada, registrada: true }))).toMatchObject({ hechos: 5, siguiente: null });
    expect(despuesDeVender("veh-1").map((l) => l.href)).toEqual([
      "/autos/dealer/inventario/veh-1#comisiones", "/contable/libro-mayor", "/autos/dealer/inventario",
    ]);
  });
});

// ---- ficha real, con la red simulada ----
type Estado = { status: string; price: string | null; fotos: number; acquired: string | null };
let estado: Estado;
const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body });

function mockRed() {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/v1/access/entitlements/batch")) {
      const results: Record<string, unknown> = {};
      for (const k of ["autos.inventory.list", "autos.inventory.photos", "autos.inventory.create"]) results[k] = { allowed: true, reason_code: "ALLOWED" };
      results["autos.costs.view"] = { allowed: false, reason_code: "DEFAULT_DENY" };
      return json({ results });
    }
    if (url.includes("/vehicles/veh-1/photos")) {
      if (init?.method === "POST") { estado.fotos += 1; return json({ id: "m1" }); }
      return json({ photos: Array.from({ length: estado.fotos }, (_, i) => ({ id: `m${i}`, thumbnail_url: `https://cdn/x${i}.jpg` })) });
    }
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) {
      return json({ id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "Hilux", year: 2021, status: estado.status, price_amount: estado.price });
    }
    if (url.includes("/margin")) return json([]);
    if (url.includes("/days")) return json({ acquired_at: estado.acquired, days_in_inventory: 3 });
    return json({ detail: "not-mocked" }, 404);
  }) as unknown as typeof fetch;
}

function montar(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

let avisos: string[];
const oir = (e: Event) => avisos.push((e as CustomEvent).detail.motivo);

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  avisos = [];
  window.addEventListener(EVENTO_PROGRESO, oir);
});
afterEach(() => window.removeEventListener(EVENTO_PROGRESO, oir));

test("la ficha muestra el ciclo con los datos leidos y al subir una foto avanza y avisa", async () => {
  estado = { status: "draft", price: null, fotos: 0, acquired: "2026-11-01T00:00:00Z" };
  mockRed();
  montar(<DealerVehicleEconomicsPage />);
  const ciclo = await screen.findByRole("region", { name: "Cargar este auto" });
  expect(within(ciclo).getByRole("heading")).toHaveTextContent("Cargar este auto: 2 de 6");
  expect(within(ciclo).getByRole("link", { name: "Siguiente paso: Subir fotos" })).toHaveAttribute("href", "#fotos");
  // Cada ancla va justo antes de su seccion.
  expect(document.getElementById("fotos")?.nextElementSibling).toBe(screen.getByTestId("vehicle-photos"));
  expect(document.getElementById("precio")?.nextElementSibling).toBe(screen.getByTestId("vehicle-edit-panel"));

  const file = new File(["x"], "DNI-cliente.jpg", { type: "image/jpeg" });
  fireEvent.change(screen.getByTestId("vehicle-photos-input"), { target: { files: [file] } });
  await waitFor(() => expect(avisos).toContain("fotos"));
  await waitFor(() => expect(within(ciclo).getByRole("heading")).toHaveTextContent("3 de 6"));
  expect(within(ciclo).getByRole("link", { name: "Siguiente paso: Poner el precio de venta" })).toHaveAttribute("href", "#precio");
});

test("al pasar a Disponible se relee la ficha, avisa 'publicar' y el siguiente paso es vender", async () => {
  estado = { status: "draft", price: "18500000", fotos: 1, acquired: "2026-11-01T00:00:00Z" };
  mockRed();
  (pasarADisponible as jest.Mock).mockImplementation(async () => { estado.status = "disponible"; return {}; });
  montar(<DealerVehicleEconomicsPage />);
  const ciclo = await screen.findByRole("region", { name: "Cargar este auto" });
  expect(within(ciclo).getByRole("link", { name: "Siguiente paso: Pasarlo a Disponible" })).toHaveAttribute("href", "#precio");
  expect(within(ciclo).getByRole("heading")).toHaveTextContent("Cargar este auto: 4 de 6");
  expect(within(ciclo).getByTestId("paso-vender")).toHaveTextContent("Primero pasalo a Disponible.");
  fireEvent.click(screen.getByTestId("vehicle-publicar"));
  await waitFor(() => expect(avisos).toEqual(["publicar"]));
  expect(await within(ciclo).findByRole("link", { name: "Siguiente paso: Registrar la venta" })).toHaveAttribute(
    "href", "/autos/dealer/inventario/veh-1/vender");
  expect(within(ciclo).getByRole("heading")).toHaveTextContent("Cargar este auto: 5 de 6");
});

test("vendido: la ficha no muestra el ciclo de carga y las comisiones tienen su ancla", async () => {
  estado = { status: "vendido", price: "100", fotos: 1, acquired: "2026-11-01T00:00:00Z" };
  mockRed();
  montar(<DealerVehicleEconomicsPage />);
  await screen.findByTestId("dealer-vehicle-ready");
  await waitFor(() => expect(screen.getByTestId("dealer-sale-commissions")).toBeInTheDocument());
  expect(document.getElementById("comisiones")?.nextElementSibling).toBe(screen.getByTestId("dealer-sale-commissions"));
  expect(screen.queryByTestId("ciclo-del-auto")).not.toBeInTheDocument();
});

test("registrar la compra avisa el progreso y ofrece volver a la ficha", async () => {
  mockRed();
  montar(<RegistrarPage />);
  await screen.findByTestId("dealer-register-ready");
  fireEvent.change(screen.getByLabelText("acquisition_mode_code"), { target: { value: "compra_local" } });
  fireEvent.change(screen.getByLabelText("acquired_at"), { target: { value: "2026-11-01T10:00" } });
  fireEvent.change(screen.getByLabelText("country_code"), { target: { value: "AR" } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar adquisición" }));
  await waitFor(() => expect(avisos).toEqual(["compra"]));
  expect(postVehicleAcquisition).toHaveBeenCalled();
  expect(screen.getByTestId("dealer-register-volver")).toHaveAttribute("href", "/autos/dealer/inventario/veh-1");
});
