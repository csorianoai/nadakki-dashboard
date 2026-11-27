/**
 * @jest-environment jsdom
 *
 * Cowork en produccion (26-nov, 4a pasada): en la RAV4 la guia "Cargar este auto" paso de "3 de 5" a "5 de 6"
 * mientras cargaba. El total solo depende de si el paso Fotos cuenta (plan con fotos) y lo hecho, de lecturas que
 * llegan en cualquier orden. Aca cada lectura se libera a mano, en orden distinto, y se registra TODO encabezado
 * "x de y" que llega a pintarse: tiene que haber uno solo, el final.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { guiaLista } from "@/app/autos/dealer/inventario/[vehicleId]/CicloDelAuto";
import { tokenStorage } from "@/lib/auth/token-storage";
import { accessBatchQueryKey } from "@/lib/access/hooks";
import { getAccessClientContext } from "@/lib/access/client";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }),
}));

type Lectura = "access" | "photos" | "days" | "purchase";
const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body });
let liberar: Record<Lectura, () => void>;

function lecturaDe(url: string): Lectura | null {
  if (url.includes("/api/v1/access/entitlements/batch")) return "access";
  if (url.includes("/vehicles/veh-1/photos")) return "photos";
  if (url.includes("/days")) return "days";
  if (url.includes("/vehicles/veh-1/purchase")) return "purchase";
  return null;
}

function respuesta(l: Lectura) {
  if (l === "access") {
    const results: Record<string, unknown> = {};
    for (const k of ["autos.inventory.list", "autos.inventory.photos", "autos.inventory.create", "autos.costs.view"]) {
      results[k] = { allowed: true, reason_code: "ALLOWED" };
    }
    return json({ results });
  }
  if (l === "photos") return json({ photos: [{ id: "m1", thumbnail_url: "https://cdn/x.jpg" }] });
  if (l === "days") return json({ acquired_at: null, days_in_inventory: 3 });
  // Compra registrada solo por /purchase (sin fecha en /days): "compra" se tilda recien cuando llega esta lectura.
  return json({ cost: { currency: "ARS", amount: "1000", paid_total: "1000" }, acquisition: { mode: "compra_local", acquired_on: "2026-11-01" } });
}

function mockRed() {
  const esperas: Partial<Record<Lectura, Array<() => void>>> = {};
  const abiertas = new Set<Lectura>();
  liberar = {} as Record<Lectura, () => void>;
  for (const l of ["access", "photos", "days", "purchase"] as Lectura[]) {
    liberar[l] = () => {
      abiertas.add(l);
      for (const r of esperas[l] ?? []) r();
      esperas[l] = [];
    };
  }
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const l = lecturaDe(url);
    if (l) {
      if (!abiertas.has(l)) await new Promise<void>((r) => (esperas[l] = [...(esperas[l] ?? []), r]));
      return respuesta(l);
    }
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) {
      return json({ id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "RAV4", year: 2022, status: "disponible", price_amount: "100" });
    }
    if (url.includes("/margin")) return json([]);
    return json({ detail: "not-mocked" }, 404);
  }) as unknown as typeof fetch;
}

/** Todo encabezado de la guia que llega al DOM, aunque dure un solo render. */
function espiarEncabezados(): { vistos: string[]; parar: () => void } {
  const vistos: string[] = [];
  const mirar = () => {
    for (const h of Array.from(document.querySelectorAll("h2"))) {
      const t = h.textContent ?? "";
      if (t.startsWith("Cargar este auto:") && vistos[vistos.length - 1] !== t) vistos.push(t);
    }
  };
  const obs = new MutationObserver(mirar);
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  return { vistos, parar: () => { mirar(); obs.disconnect(); } };
}

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
});

test("guiaLista espera cada lectura de la que dependen los pasos", () => {
  const todo = { tenantId: "t", daysPending: false, costsView: true, compraPending: false, photosAllowed: true, fotosPending: false };
  expect(guiaLista(todo)).toBe(true);
  expect(guiaLista({ ...todo, tenantId: "" })).toBe(false);
  expect(guiaLista({ ...todo, daysPending: true })).toBe(false);
  expect(guiaLista({ ...todo, compraPending: true })).toBe(false);
  expect(guiaLista({ ...todo, fotosPending: true })).toBe(false);
  // Lo que no se pide (sin plan de fotos o sin ver costos) no se espera.
  expect(guiaLista({ ...todo, costsView: false, compraPending: true, photosAllowed: false, fotosPending: true })).toBe(true);
});

const ORDENES: Lectura[][] = [
  ["access", "days", "purchase", "photos"],
  ["access", "photos", "days", "purchase"],
  ["access", "purchase", "photos", "days"],
];

test.each(ORDENES)("lecturas en orden %s, %s, %s, %s: un solo total, el final, y mientras tanto 'cargando'", async (...orden) => {
  mockRed();
  const espia = espiarEncabezados();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><DealerVehicleEconomicsPage /></QueryClientProvider>);
  for (const l of orden) {
    await act(async () => { liberar[l](); await new Promise((r) => setTimeout(r, 0)); });
    if (l !== orden[orden.length - 1] && l !== "access") {
      // La ficha puede tardar en pintarse; cuando aparece, la guia dice que carga y no cuenta nada.
      expect(await screen.findByTestId("ciclo-cargando")).toHaveTextContent("Cargando los pasos de este auto");
      expect(screen.queryByRole("region", { name: "Cargar este auto" })).toBeNull();
    }
  }
  const ciclo = await screen.findByRole("region", { name: "Cargar este auto" });
  // datos, compra (por /purchase), fotos, precio y publicar hechos; vender pendiente; costos opcional.
  await waitFor(() => expect(within(ciclo).getByRole("heading")).toHaveTextContent("Cargar este auto: 5 de 6"));
  espia.parar();
  expect(espia.vistos).toEqual(["Cargar este auto: 5 de 6"]);
  expect(screen.queryByTestId("ciclo-cargando")).toBeNull();
});

test("plan en cache vencida (sin fotos ni costos) que al releerse si los incluye: la guia espera y sale una sola vez", async () => {
  mockRed();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Lo que dejo otra ficha hace mas de un minuto (staleTime de acceso: 60 s), con el plan anterior.
  const viejo: Record<string, unknown> = {};
  for (const k of ["autos.inventory.list", "autos.inventory.create"]) viejo[k] = { allowed: true, reason_code: "ALLOWED" };
  viejo["autos.inventory.photos"] = { allowed: false, reason_code: "UPGRADE_REQUIRED" };
  viejo["autos.costs.view"] = { allowed: false, reason_code: "DEFAULT_DENY" };
  client.setQueryData(
    accessBatchQueryKey(["autos.inventory.list", "autos.inventory.photos", "autos.inventory.create", "autos.costs.view"], getAccessClientContext()),
    { results: viejo },
    { updatedAt: Date.now() - 120_000 },
  );
  const espia = espiarEncabezados();
  render(<QueryClientProvider client={client}><DealerVehicleEconomicsPage /></QueryClientProvider>);
  // La ficha se pinta con el plan en cache, pero la guia no cuenta nada mientras el plan se relee.
  await screen.findByTestId("dealer-vehicle-ready");
  await act(async () => { liberar.days(); await new Promise((r) => setTimeout(r, 0)); });
  expect(await screen.findByTestId("ciclo-cargando")).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Cargar este auto" })).toBeNull();
  for (const l of ["access", "photos", "purchase"] as Lectura[]) {
    await act(async () => { liberar[l](); await new Promise((r) => setTimeout(r, 0)); });
  }
  const ciclo = await screen.findByRole("region", { name: "Cargar este auto" });
  await waitFor(() => expect(within(ciclo).getByRole("heading")).toHaveTextContent("Cargar este auto: 5 de 6"));
  espia.parar();
  // Sin la espera se veia "Cargar este auto: 3 de 5" (sin fotos ni compra) y despues "5 de 6": el salto de la RAV4.
  expect(espia.vistos).toEqual(["Cargar este auto: 5 de 6"]);
});
