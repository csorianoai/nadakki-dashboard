/**
 * El inventario decide por el BATCH, no por el contexto local.
 *
 * Defecto medido en produccion con Mapaal: el batch CONCEDE
 * `autos.inventory.list` y a /api/v1/autos/* no llegaba ninguna peticion. La
 * pantalla se cerraba sola antes de pedir nada, porque miraba
 * `resolveDealerAccessContext()` y ese contexto nunca llega a "ready":
 * `setDealerAccessContext` (lib/dealer/access-context.ts:122) no tiene ningun
 * llamador fuera de tests, y el login (contexts/AuthContext.tsx:100-112) solo
 * guarda tenant, nombre, rol y plan. Sin dealer, `resolveDealerAccessContext`
 * devuelve `no_dealer` con "DEFAULT_DENY" (:200-207).
 *
 * Los cuatro casos que pide el packet estan abajo, mas la separacion que hace
 * falta para que no vuelva: el `dealerId` se usa para CONSTRUIR la peticion y no
 * para decidir el acceso.
 *
 * `fetchDealerInventory` se mockea para poder afirmar que la peticion SALE --que
 * es el sintoma-- y con que dealer.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import DealerInventoryPage from "@/app/autos/dealer/inventario/page";
import { AccessApiError } from "@/lib/access/client";
import { ACCESS_UNVERIFIED_MESSAGE } from "@/lib/access/reason-codes";
import { VEHICLE_WRITE_CAPABILITY } from "@/lib/dealer-management/vehicle-manual";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

/**
 * Sin dealer en la sesion, la pagina pregunta por las asignaciones antes de
 * rendirse: es el selector de D1. Por defecto se devuelven CERO, que es el caso
 * que estos tests miden; los de varias asignaciones viven en
 * tests/app/InventarioSelectorDealer.test.tsx.
 */
const fetchAsignaciones = jest.fn();
jest.mock("@/lib/dealer/dealer-context-api", () => ({
  ...jest.requireActual("@/lib/dealer/dealer-context-api"),
  fetchMyDealerContext: () => fetchAsignaciones(),
}));

const fetchInventory = jest.fn();
jest.mock("@/lib/dealer-management/inventory", () => ({
  fetchDealerInventory: (dealerId: string) => fetchInventory(dealerId),
}));

const batchMock = jest.fn();
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => batchMock(keys),
}));

const CAPABILITY = "autos.inventory.list";

function batch(
  estado: Partial<{ cargando: boolean; error: unknown; allowed: boolean; reason: string | null; sinClave: boolean }>,
) {
  const results = estado.sinClave
    ? {}
    : {
        [CAPABILITY]: {
          allowed: estado.allowed ?? false,
          reason_code: estado.reason === undefined ? (estado.allowed ? "ALLOWED" : null) : estado.reason,
          limit: null,
          current_usage: null,
        },
      };
  return {
    isPending: estado.cargando ?? false,
    isLoading: estado.cargando ?? false,
    isError: Boolean(estado.error),
    error: estado.error ?? null,
    data: estado.error ? undefined : { scope: "tenant", unitScope: "omitted", results },
  };
}

/** Sesion con dealer pero SIN unidad organizativa: el caso real de Mapaal. */
function sesionConDealerSinUnidad() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  window.localStorage.setItem("nadakki_dealer_id", "dealer-a");
  window.localStorage.setItem("nadakki_dealer_tenant_id", "tenant-a");
  window.localStorage.removeItem("nadakki_organization_unit_id");
}

function sesionSinDealer() {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerInventoryPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  batchMock.mockReset();
  fetchInventory.mockReset();
  fetchInventory.mockResolvedValue([]);
  fetchAsignaciones.mockReset();
  fetchAsignaciones.mockResolvedValue([]);
});

describe("allowed=true: se pide el inventario", () => {
  it("con dealerId en la sesion, la peticion SALE", async () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    await waitFor(() => expect(fetchInventory).toHaveBeenCalledWith("dealer-a"));
  });

  it("sin unidad organizativa NO aparece NO_ORGANIZATION_UNIT: la unidad la resuelve el backend", async () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    await waitFor(() => expect(fetchInventory).toHaveBeenCalled());
    expect(screen.queryByText(/NO_ORGANIZATION_UNIT/i)).toBeNull();
    expect(screen.queryByText(/no_organization_unit/)).toBeNull();
    expect(screen.queryByText(/bloqueado/i)).toBeNull();
  });

  it("pide al batch las dos claves de la pantalla, y ninguna ajena", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    // Leer el inventario y crear un vehiculo, en UNA sola consulta. Antes aqui
    // se afirmaba "solo la de lectura"; el CTA de alta manual necesita la de
    // escritura y pedirla en un batch aparte seria una peticion de mas. Lo que
    // sigue fijado --y es lo que importa-- es que no se pide ninguna clave que
    // esta pantalla no use.
    expect(batchMock).toHaveBeenCalledWith([CAPABILITY, VEHICLE_WRITE_CAPABILITY]);
  });

  it("muestra los vehiculos que devuelve el contrato privado", async () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: true }));
    fetchInventory.mockResolvedValue([
      { id: "veh-1", make: "Toyota", model: "Hilux", year: "2021", status: "draft" },
    ]);
    montar();
    expect(await screen.findByText("2021 Toyota Hilux")).toBeInTheDocument();
  });
});

describe("ningun codigo inventado", () => {
  it("un 500 del batch no muestra DEFAULT_DENY", async () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(
      batch({
        error: new AccessApiError({
          status: 500,
          reason_code: null,
          detail: null,
          endpoint: "/api/v1/access/entitlements/batch",
        }),
      }),
    );
    montar();
    expect(await screen.findByTestId("inventario-error-acceso")).toBeInTheDocument();
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
    expect(screen.getByTestId("inventario-error-acceso")).toHaveAttribute("data-http-status", "500");
  });

  it("un 403 con reason_code muestra ESE codigo, no otro", async () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(
      batch({
        error: new AccessApiError({
          status: 403,
          reason_code: "UPGRADE_REQUIRED",
          detail: null,
          endpoint: "/api/v1/access/entitlements/batch",
        }),
      }),
    );
    montar();
    expect(await screen.findByTestId("inventario-error-acceso")).toHaveAttribute(
      "data-reason-code",
      "UPGRADE_REQUIRED",
    );
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
  });

  it("clave ausente en results: denegado, y se dice que falta la decision", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ sinClave: true }));
    montar();
    const aviso = screen.getByTestId("inventario-sin-decision");
    expect(aviso).toHaveAttribute("data-allowed", "false");
    expect(aviso).toHaveTextContent("no devolvió una decisión");
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
    expect(fetchInventory).not.toHaveBeenCalled();
  });

  it("denegado sin reason_code lo dice, en vez de inventarlo", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: false, reason: null }));
    montar();
    expect(screen.getByTestId("inventario-denegado")).toHaveTextContent("denegó sin indicar motivo");
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
  });

  it("denegado por plan muestra su reason_code tal cual", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: false, reason: "UPGRADE_REQUIRED" }));
    montar();
    expect(screen.getByTestId("inventario-denegado")).toHaveAttribute("data-reason-code", "UPGRADE_REQUIRED");
  });
});

describe("no_organization_unit en la respuesta", () => {
  it("se lee como no verificado, no como denegacion", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: false, reason: "no_organization_unit" }));
    montar();
    expect(screen.getByTestId("inventario-no-verificado")).toHaveTextContent(ACCESS_UNVERIFIED_MESSAGE);
    expect(screen.queryByTestId("inventario-denegado")).toBeNull();
    expect(screen.queryByText(/\bplan\b/i)).toBeNull();
  });

  it("vale igual con la forma en MAYUSCULAS, que es la que staging aun emite", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: false, reason: "NO_ORGANIZATION_UNIT" }));
    montar();
    expect(screen.getByTestId("inventario-no-verificado")).toBeInTheDocument();
  });

  it("y con no_beneficiary_entitlement", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ allowed: false, reason: "no_beneficiary_entitlement" }));
    montar();
    expect(screen.getByTestId("inventario-no-verificado")).toBeInTheDocument();
  });
});

describe("concedido pero sin dealer en la sesion", () => {
  it("lo dice con honestidad y NO lo llama bloqueado", async () => {
    sesionSinDealer();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    // Pasa por "Verificando tus concesionarios": con cero asignaciones
    // desemboca en el mismo aviso de siempre.
    const aviso = await screen.findByTestId("inventario-sin-dealer");
    expect(aviso).toHaveTextContent("No se pudo identificar el dealer de tu sesión");
    expect(aviso.textContent ?? "").not.toMatch(/bloquead/i);
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
  });

  it("no lleva ningun enlace", async () => {
    sesionSinDealer();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    await screen.findByTestId("inventario-sin-dealer");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("no se pide el inventario sin dealer con el que pedirlo", () => {
    sesionSinDealer();
    batchMock.mockReturnValue(batch({ allowed: true }));
    montar();
    expect(fetchInventory).not.toHaveBeenCalled();
  });
});

describe("mientras el batch no responde", () => {
  it("no se pide el inventario ni se afirma nada", () => {
    sesionConDealerSinUnidad();
    batchMock.mockReturnValue(batch({ cargando: true }));
    montar();
    expect(screen.getByText("Verificando acceso…")).toBeInTheDocument();
    expect(fetchInventory).not.toHaveBeenCalled();
    expect(screen.queryByText(/DEFAULT_DENY/)).toBeNull();
  });
});
