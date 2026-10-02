/**
 * El panel del dealer SINCRONIZA el dealer de la sesion antes de pintar.
 *
 * El sintoma medido en produccion: el inventario de Mapaal salia vacio y SIN
 * ninguna peticion al backend. La causa no estaba en la pantalla, sino en que
 * nadie escribia el binding del dealer: `setDealerAccessContext`
 * (lib/dealer/access-context.ts:122) no tenia llamadores y el login solo guarda
 * el tenant, asi que `resolveDealerAccessContext` devolvia `no_dealer` y la
 * pantalla se cerraba sola.
 *
 * Por eso aqui se monta la CADENA COMPLETA --layout del dealer, shell y la
 * pagina del inventario como hijo-- con el `dealer-context-api` REAL y solo la
 * red mockeada. Lo que se afirma es la peticion que antes no salia:
 *
 *   GET /api/v1/autos/dealers/<dealer>/vehicles
 *
 * Un test que mockease la sincronizacion afirmaria su propio mock. Con la
 * sincronizacion quitada del shell, el caso "pide el inventario" se pone rojo:
 * el Local Storage se queda sin dealer y la pantalla no llega a preguntar.
 *
 * Los UUID son los de Mapaal y viven SOLO en este fixture.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import DealerLayout from "@/app/autos/dealer/layout";
import DealerInventoryPage from "@/app/autos/dealer/inventario/page";
import { DEALER_CONTEXT_PATH } from "@/lib/dealer/dealer-context-api";
import { resetDealerAccessMemoryForTests } from "@/lib/dealer/access-context";

// Rompe la cadena de imports antes de `lib/config/backend-url`, que lanza
// BackendUrlNotConfiguredError al cargarse sin backend declarado.
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/autos/dealer/inventario",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: undefined, isPending: false, isLoading: false }),
}));

/** El acceso es red: se concede todo lo que se pregunte. El filtrado por
 *  entitlements es contrato de otros tests; aqui se mide el binding. */
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: (keys: string[]) => ({
    isError: false,
    error: null,
    isPending: false,
    isLoading: false,
    data: { results: Object.fromEntries(keys.map((k) => [k, { allowed: true }])) },
  }),
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const TENANT = "tenant-mapaal";
const DEALER = "1bc6a6cd-2592-442a-9d70-2d1b630762fc";
const UNIDAD = "ae4eab3a-733b-44d9-a573-1ee21dc9e631";
const OTRO_DEALER = "2cd7b7de-3603-553b-a81e-3e32c741873d";
const RUTA_INVENTARIO = `/api/v1/autos/dealers/${DEALER}/vehicles`;

function respuesta(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

/**
 * Enruta por path, en vez de por orden de llamada: asi el test no depende de
 * que la sincronizacion ocurra antes o despues de la peticion del inventario.
 */
function red(opciones: { contexto: Response; vehiculos?: unknown[] }) {
  fetchMock.mockImplementation(async (path: string) => {
    if (path === DEALER_CONTEXT_PATH) return opciones.contexto;
    if (path.includes("/vehicles")) return respuesta(200, { vehicles: opciones.vehiculos ?? [] });
    return respuesta(404, { detail: `ruta no sembrada: ${path}` });
  });
}

function asignaciones(...items: Array<{ dealer_id: string; organization_unit_id?: string | null }>) {
  return respuesta(200, {
    assignments: items.map((item) => ({
      dealer_id: item.dealer_id,
      organization_unit_id: item.organization_unit_id ?? UNIDAD,
      dealer_name: "Mapaal Autos",
    })),
  });
}

function montar(children: ReactNode = <DealerInventoryPage />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerLayout>{children}</DealerLayout>
    </QueryClientProvider>,
  );
}

/** Rutas de `/autos/*` pedidas, sin contar la del propio contexto. */
function rutasDeAutos() {
  return fetchMock.mock.calls
    .map(([path]) => path as string)
    .filter((path) => path.startsWith("/api/v1/autos/") && path !== DEALER_CONTEXT_PATH);
}

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  fetchMock.mockReset();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

describe("con una asignacion", () => {
  it("pide el inventario privado del dealer que dijo el backend", async () => {
    red({ contexto: asignaciones({ dealer_id: DEALER }) });

    montar();

    await waitFor(() => {
      expect(rutasDeAutos()).toContain(RUTA_INVENTARIO);
    });
  });

  it("y el binding queda escrito con el dealer y la unidad del backend", async () => {
    red({ contexto: asignaciones({ dealer_id: DEALER }) });

    montar();

    await waitFor(() => {
      expect(window.localStorage.getItem("nadakki_dealer_id")).toBe(DEALER);
    });
    expect(window.localStorage.getItem("nadakki_organization_unit_id")).toBe(UNIDAD);
  });

  it("pinta el inventario que devuelve el contrato privado", async () => {
    red({
      contexto: asignaciones({ dealer_id: DEALER }),
      vehiculos: [{ id: "v-1", make: "Toyota", model: "Corolla", year: "2021", status: "available" }],
    });

    montar();

    expect(await screen.findByText("2021 Toyota Corolla")).toBeInTheDocument();
  });

  it("pide la ruta del contexto una sola vez: es una vez por sesion", async () => {
    red({ contexto: asignaciones({ dealer_id: DEALER }) });

    montar();

    await waitFor(() => {
      expect(rutasDeAutos()).toContain(RUTA_INVENTARIO);
    });
    const vecesContexto = fetchMock.mock.calls.filter(([path]) => path === DEALER_CONTEXT_PATH).length;
    expect(vecesContexto).toBe(1);
  });
});

describe("sin asignacion", () => {
  it("no pide nada de /autos/* y lo dice sin enlace", async () => {
    red({ contexto: respuesta(200, { assignments: [] }) });

    montar();

    const aviso = await screen.findByTestId("dealer-context-aviso");
    // Literal del protocolo de D1: es el que se verifica en produccion.
    expect(aviso).toHaveTextContent("Tu usuario no está asignado a ningún concesionario");
    expect(aviso.querySelector("a")).toBeNull();
    expect(rutasDeAutos()).toEqual([]);
  });

  it("no pinta el hijo: una pantalla que lea el contexto no llega a decidir", async () => {
    red({ contexto: respuesta(200, { assignments: [] }) });

    montar(<p>contenido del hijo</p>);

    await screen.findByTestId("dealer-context-aviso");
    expect(screen.queryByText("contenido del hijo")).toBeNull();
  });
});

describe("varias asignaciones", () => {
  it("no elige ninguna, lo informa y no pide inventario", async () => {
    red({ contexto: asignaciones({ dealer_id: DEALER }, { dealer_id: OTRO_DEALER }) });

    montar();

    const aviso = await screen.findByTestId("dealer-context-aviso");
    expect(aviso).toHaveTextContent("Tu usuario tiene varios dealers asignados; falta elegir uno");
    expect(aviso.querySelector("a")).toBeNull();
    expect(rutasDeAutos()).toEqual([]);
    expect(window.localStorage.getItem("nadakki_dealer_id")).toBeNull();
  });
});

describe("errores del contexto", () => {
  it("un reason_code no verificable sale como 'No se pudieron verificar tus accesos'", async () => {
    red({ contexto: respuesta(403, { reason_code: "no_beneficiary_entitlement" }) });

    montar();

    const aviso = await screen.findByTestId("dealer-context-aviso");
    expect(aviso).toHaveTextContent("No se pudieron verificar tus accesos");
    expect(aviso).not.toHaveTextContent("No incluido en tu plan");
    expect(aviso.querySelector("a")).toBeNull();
  });

  it("cualquier otro reason_code se muestra TAL CUAL, sin traducirlo", async () => {
    red({ contexto: respuesta(403, { reason_code: "capability_not_in_archetype" }) });

    montar();

    expect(await screen.findByTestId("dealer-context-aviso")).toHaveTextContent(
      "capability_not_in_archetype",
    );
  });

  it("un 500 sin reason_code no inventa ninguno", async () => {
    red({ contexto: respuesta(500, {}) });

    montar();

    const aviso = await screen.findByTestId("dealer-context-aviso");
    expect(aviso).toHaveTextContent("HTTP 500");
    expect(aviso.getAttribute("data-reason-code")).toBe("");
  });

  it("una forma invalida no borra el binding de la sesion", async () => {
    window.localStorage.setItem("nadakki_dealer_id", DEALER);
    red({ contexto: respuesta(200, { assignments: "nada" }) });

    montar();

    await screen.findByTestId("dealer-context-aviso");
    expect(window.localStorage.getItem("nadakki_dealer_id")).toBe(DEALER);
  });
});

describe("mientras sincroniza", () => {
  it("pinta Verificando y no al hijo", async () => {
    let resolver: (value: Response) => void = () => {};
    const enVuelo = new Promise<Response>((resolve) => {
      resolver = resolve;
    });
    fetchMock.mockImplementation(async (path: string) => {
      if (path === DEALER_CONTEXT_PATH) return enVuelo;
      return respuesta(200, { vehicles: [] });
    });

    montar(<p>contenido del hijo</p>);

    expect(await screen.findByTestId("dealer-context-verificando")).toHaveTextContent("Verificando");
    expect(screen.queryByText("contenido del hijo")).toBeNull();

    resolver(asignaciones({ dealer_id: DEALER }));
    expect(await screen.findByText("contenido del hijo")).toBeInTheDocument();
  });
});

describe("nada de esto inventa una denegacion", () => {
  it("DEFAULT_DENY no aparece en ninguno de los estados", async () => {
    const casos: Array<Response> = [
      respuesta(200, { assignments: [] }),
      respuesta(403, { reason_code: "no_organization_unit" }),
      respuesta(500, {}),
      respuesta(200, { assignments: "nada" }),
    ];
    for (const contexto of casos) {
      fetchMock.mockReset();
      window.localStorage.clear();
      resetDealerAccessMemoryForTests();
      window.localStorage.setItem("nadakki_tenant_id", TENANT);
      red({ contexto });

      const vista = montar();
      await screen.findByTestId("dealer-context-aviso");
      expect(document.body.textContent).not.toContain("DEFAULT_DENY");
      vista.unmount();
    }
  });
});
