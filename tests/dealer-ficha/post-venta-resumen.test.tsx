/**
 * @jest-environment jsdom
 *
 * Cowork (26-nov, portada de qa-dealer-nadakki): "Tras una venta" listaba 134 lineas "<uuid> · posted" en Contable y
 * 25 "<uuid> · <estado>" en anuncios (2 vendido, 2 disponible, 21 archivado). Ahora: cifra legible y como mucho 3
 * lineas con dato legible; nunca un uuid; sin archivados.
 * Campos medidos en el backend: asientos (routers/contable/asientos_router.py, list_asientos) traen numero_asiento,
 * fecha_asiento, descripcion y status; autos (routers/autos_portal_router.py, _SQL_LISTA_PRIVADA) traen make, model,
 * year, status y stock_number.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { DealerPostSaleCores } from "@/components/dealer/DealerPostSaleCores";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";
import { fechaCorta, parsePostSaleAsiento, parsePostSaleListing, resumenAnuncios, resumenAsientos } from "@/lib/dealer/post-sale";

jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));

const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body });
const uuid = (i: number) => `0000000${i}`.slice(-8) + "-1111-4222-8333-444455556666";

const ASIENTOS = Array.from({ length: 134 }, (_, i) => ({
  id: uuid(i), status: "posted", numero_asiento: 134 - i, fecha_asiento: `2026-11-${String(26 - (i % 20)).padStart(2, "0")}`,
  descripcion: i === 0 ? "Venta Toyota RAV4" : i === 1 ? null : `Compra ${i}`,
}));
const AUTOS = [
  ...Array.from({ length: 21 }, (_, i) => ({ id: uuid(100 + i), status: "archivado", make: "Fiat", model: "Uno", year: 2010 })),
  { id: uuid(1), status: "vendido", make: "Toyota", model: "RAV4", year: 2021, stock_number: "A-12" },
  { id: uuid(2), status: "disponible", make: "Ford", model: "Ranger", year: 2020, stock_number: null },
  { id: uuid(3), status: "vendido", make: null, model: null, year: null },
  { id: uuid(4), status: "disponible", make: "VW", model: "Amarok", year: 2019, stock_number: 7 },
];

function red(asientos: unknown, autos: unknown) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/legal/cases")) return json({ detail: "capability_denied:legal.cases.view:core_not_in_plan" }, 403);
    if (url.includes("/api/v1/contable/asientos")) return json(asientos);
    if (url.includes("/api/marketing/scheduler/heartbeat")) return json({ detail: "heartbeat_not_found" }, 404);
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles")) return json({ vehicles: autos });
    return json({ detail: "not-mocked" }, 404);
  }) as unknown as typeof fetch;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><DealerPostSaleCores /></QueryClientProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
});

test("resumenes puros: cifra, ultimos legibles y nada sin dato", () => {
  const asientos = ASIENTOS.map(parsePostSaleAsiento).filter((a) => a != null);
  expect(resumenAsientos(asientos)).toEqual({
    total: 134,
    ultimos: ["26/11/2026 · N.º 134 · Venta Toyota RAV4", "25/11/2026 · N.º 133", "24/11/2026 · N.º 132 · Compra 2"],
  });
  // Sin numero ni descripcion: solo se cuenta.
  expect(resumenAsientos([{ id: uuid(9), status: "posted", numero: null, fecha: "2026-11-01", descripcion: null }])).toEqual({ total: 1, ultimos: [] });
  const autos = AUTOS.map(parsePostSaleListing).filter((a) => a != null);
  expect(resumenAnuncios(autos)).toEqual({
    conteo: "2 disponibles · 2 vendidos",
    ultimos: ["Toyota RAV4 2021 · stock A-12 · vendido", "Ford Ranger 2020 · disponible", "VW Amarok 2019 · stock 7 · disponible"],
  });
  expect(resumenAnuncios(autos.filter((a) => a.status === "archivado"))).toEqual({ conteo: null, ultimos: [] });
  expect(fechaCorta("2026-11-26T03:00:00Z")).toBe("26/11/2026");
  expect(fechaCorta(null)).toBeNull();
});

test("la tarjeta muestra cifras en palabras y ningun uuid ni archivado", async () => {
  red(ASIENTOS, AUTOS);
  const { container } = montar();
  expect(await screen.findByTestId("dealer-post-sale-ready")).toBeInTheDocument();
  expect(screen.getByTestId("dealer-post-sale-contable-resumen")).toHaveTextContent("134 asientos registrados. Últimos:");
  expect(screen.getByTestId("dealer-post-sale-contable-resumen").querySelectorAll("li")).toHaveLength(3);
  expect(screen.getByTestId("dealer-post-sale-anuncios-resumen")).toHaveTextContent("2 disponibles · 2 vendidos");
  expect(screen.getByTestId("dealer-post-sale-anuncios-resumen").querySelectorAll("li")).toHaveLength(3);
  expect(container.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  expect(container.textContent).not.toMatch(/archivado|Fiat Uno|posted/i);
  // Lo que ya estaba bien sigue igual.
  expect(screen.getByTestId("dealer-post-sale-legal")).toHaveTextContent("No incluido en tu plan.");
  expect(screen.getByTestId("dealer-post-sale-latido")).toHaveTextContent("Sin datos todavía.");
});

test("sin datos legibles: solo el conteo; solo archivados: sin autos activos", async () => {
  red([{ id: uuid(1), status: "posted" }], [{ id: uuid(2), status: "archivado" }]);
  const { container } = montar();
  expect(await screen.findByTestId("dealer-post-sale-ready")).toBeInTheDocument();
  expect(screen.getByTestId("dealer-post-sale-contable-resumen")).toHaveTextContent(/^1 asiento registrado\.$/);
  expect(screen.getByTestId("dealer-post-sale-anuncios")).toHaveTextContent("Sin autos activos en el inventario.");
  expect(container.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
