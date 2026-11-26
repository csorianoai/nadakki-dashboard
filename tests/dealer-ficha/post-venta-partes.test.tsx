/**
 * @jest-environment jsdom
 *
 * Cowork (26-nov, produccion): la portada del panel decia "No se pudo leer el estado post-venta" con detalle
 * DEFAULT_DENY porque UNA de las cuatro lecturas fallaba (plan sin Legal: 403 capability_denied; tenant sin
 * marketing: 404 heartbeat_not_found) y Promise.all tumbaba la tarjeta entera.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { DealerPostSaleCores } from "@/components/dealer/DealerPostSaleCores";
import { AccessApiError } from "@/lib/access/client";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";
import { clasificarFalloPostSale, parseCapabilityDenied } from "@/lib/dealer/post-sale";

jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: jest.fn(() => false) }));

const json = (body: unknown, status = 200) => ({ ok: status < 300, status, json: async () => body });
type Resp = ReturnType<typeof json>;

function red(over: { legal?: Resp; asientos?: Resp; latido?: Resp; autos?: Resp }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/legal/cases")) return over.legal ?? json({ cases: [{ id: "case-1", state: "ACTIVE" }] });
    if (url.includes("/api/v1/contable/asientos")) return over.asientos ?? json([{ id: "asi-1", status: "posted" }]);
    if (url.includes("/api/marketing/scheduler/heartbeat")) return over.latido ?? json({ alive: true });
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles")) return over.autos ?? json({ vehicles: [{ id: "veh-1", status: "sold" }] });
    return json({ detail: "not-mocked" }, 404);
  }) as unknown as typeof fetch;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><DealerPostSaleCores /></QueryClientProvider>);
}

const SIN_LEGAL = json({ detail: "capability_denied:legal.cases.view:core_not_in_plan" }, 403);
const SIN_LATIDO = json({ detail: "heartbeat_not_found" }, 404);

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
});

describe("lectura del fallo de cada parte", () => {
  test("capability_denied:<cap>:<razon> se lee en lib/dealer", () => {
    expect(parseCapabilityDenied("capability_denied:legal.cases.view:core_not_in_plan")).toEqual({
      capability: "legal.cases.view", razon: "core_not_in_plan",
    });
    expect(parseCapabilityDenied("capability_denied:legal.cases.view")).toEqual({ capability: "legal.cases.view", razon: null });
    expect(parseCapabilityDenied("DEFAULT_DENY")).toBeNull();
    expect(parseCapabilityDenied(null)).toBeNull();
  });
  const err = (status: number, detail: unknown) => new AccessApiError({ status, reason_code: null, detail, endpoint: "/x" });
  test.each([
    [err(403, "capability_denied:legal.cases.view:x"), "no_incluido"],
    [err(403, { detail: "capability_denied:legal.cases.view:x" }), "no_incluido"],
    [err(404, "heartbeat_not_found"), "sin_datos"],
    [err(403, { reason_code: "DEFAULT_DENY" }), "error"],
    [err(404, "otra_cosa"), "error"],
    [err(500, null), "error"],
    [new Error("red"), "error"],
  ])("%#", (e, esperado) => expect(clasificarFalloPostSale(e)).toBe(esperado));
});

describe("tarjeta post-venta", () => {
  test("plan sin Legal y tenant sin marketing: el resto se muestra y no hay detalle tecnico", async () => {
    red({ legal: SIN_LEGAL, latido: SIN_LATIDO });
    montar();
    const lista = await screen.findByTestId("dealer-post-sale-ready");
    expect(within(screen.getByTestId("dealer-post-sale-legal")).getByText("No incluido en tu plan.")).toBeInTheDocument();
    expect(within(screen.getByTestId("dealer-post-sale-latido")).getByText("Sin datos todavía.")).toBeInTheDocument();
    // Resumen legible (post-venta-resumen.test.tsx): sin ids crudos.
    expect(screen.getByTestId("dealer-post-sale-contable-resumen")).toHaveTextContent("1 asiento registrado.");
    expect(screen.getByTestId("dealer-post-sale-anuncios")).toHaveTextContent("Sin autos activos en el inventario.");
    expect(screen.queryByText(/asi-1|veh-1/)).toBeNull();
    expect(lista.textContent).not.toMatch(/DEFAULT_DENY|capability_denied|heartbeat_not_found|Detalle técnico/);
    expect(document.body.innerHTML).not.toContain("DEFAULT_DENY");
  });

  test("una parte que falla por otra razon solo marca esa parte", async () => {
    red({ asientos: json({ detail: "boom" }, 500) });
    montar();
    await screen.findByTestId("dealer-post-sale-ready");
    expect(screen.getByTestId("dealer-post-sale-contable")).toHaveAttribute("data-estado", "error");
    expect(screen.getByText(/case-1 · ACTIVE/)).toBeInTheDocument();
    expect(screen.queryByTestId("dealer-post-sale-error")).not.toBeInTheDocument();
  });

  test("si no se pudo leer ninguna parte: aviso general, sin DEFAULT_DENY", async () => {
    const fallo = json({ detail: { reason_code: "DEFAULT_DENY" } }, 403);
    red({ legal: fallo, asientos: fallo, latido: fallo, autos: fallo });
    montar();
    expect(await screen.findByTestId("dealer-post-sale-error")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/DEFAULT_DENY|Detalle técnico/);
  });
});
