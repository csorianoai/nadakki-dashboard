/**
 * PREPARACION LOCAL (sin PR): el selector de concesionario de D1.
 *
 * Decision de Cesar, la mas simple: con UNA asignacion se usa sola y no hay
 * selector; con varias, un selector en la pagina de Inventario que dura lo que
 * dura la sesion y NO persiste nada.
 *
 * Esta rama local integra #562 (la pagina decide por el batch) con la cadena
 * #563 -> #565 -> #569 (el shell sincroniza y deja pasar varias asignaciones).
 * El PR se abre sobre #562 cuando #562 este en `staging`.
 *
 * Lo que se afirma, y por que importa cada cosa:
 *
 *  - Con una asignacion NO se pide la lista de asignaciones: el caso de Mapaal
 *    no paga una peticion extra por una funcion que no usa.
 *  - Con varias NO se pide el inventario de nadie hasta que el usuario elige.
 *    Elegir por el seria ensenarle el inventario de otro concesionario.
 *  - Al elegir, la peticion sale con EL dealer elegido, no con el primero.
 *  - La eleccion no toca `localStorage` ni `sessionStorage`.
 *
 * Los UUID son los de Mapaal y viven solo en este fixture.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import DealerInventoryPage from "@/app/autos/dealer/inventario/page";
import { DEALER_CONTEXT_PATH } from "@/lib/dealer/dealer-context-api";
import { resetDealerAccessMemoryForTests } from "@/lib/dealer/access-context";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

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

const DEALER = "1bc6a6cd-2592-442a-9d70-2d1b630762fc";
const UNIDAD = "ae4eab3a-733b-44d9-a573-1ee21dc9e631";
const OTRO_DEALER = "2cd7b7de-3603-553b-a81e-3e32c741873d";

function respuesta(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

function asignacion(dealerId: string, nombre: string) {
  return { dealer_id: dealerId, organization_unit_id: UNIDAD, dealer_name: nombre };
}

function red(opciones: { contexto?: Response; vehiculos?: unknown[] } = {}) {
  fetchMock.mockImplementation(async (path: string) => {
    if (path === DEALER_CONTEXT_PATH) {
      return opciones.contexto ?? respuesta(200, { assignments: [] });
    }
    if (path.includes("/vehicles")) return respuesta(200, { vehicles: opciones.vehiculos ?? [] });
    return respuesta(404, { detail: `ruta no sembrada: ${path}` });
  });
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DealerInventoryPage />
    </QueryClientProvider>,
  );
}

function rutas() {
  return fetchMock.mock.calls.map(([path]) => path as string);
}

function rutasDeVehiculos() {
  return rutas().filter((p) => p.includes("/vehicles"));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetDealerAccessMemoryForTests();
  fetchMock.mockReset();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-mapaal");
});

describe("una sola asignacion: el binding ya esta escrito", () => {
  beforeEach(() => {
    // Lo que deja el shell tras sincronizar con una asignacion.
    window.localStorage.setItem("nadakki_dealer_id", DEALER);
    window.localStorage.setItem("nadakki_organization_unit_id", UNIDAD);
  });

  it("no pinta selector y pide el inventario de ese dealer", async () => {
    red();

    montar();

    await waitFor(() => {
      expect(rutasDeVehiculos()).toContain(`/api/v1/autos/dealers/${DEALER}/vehicles`);
    });
    expect(screen.queryByTestId("inventario-selector-dealer")).toBeNull();
  });

  it("NO pide la lista de asignaciones: seria una peticion que no usa", async () => {
    red();

    montar();

    await waitFor(() => {
      expect(rutasDeVehiculos().length).toBe(1);
    });
    expect(rutas()).not.toContain(DEALER_CONTEXT_PATH);
  });
});

describe("varias asignaciones: elige el usuario", () => {
  function dos() {
    return respuesta(200, {
      assignments: [asignacion(DEALER, "Mapaal Autos"), asignacion(OTRO_DEALER, "Otro Concesionario")],
    });
  }

  it("pinta el selector con un boton por concesionario, con su nombre", async () => {
    red({ contexto: dos() });

    montar();

    const selector = await screen.findByTestId("inventario-selector-dealer");
    expect(selector).toHaveTextContent("Mapaal Autos");
    expect(selector).toHaveTextContent("Otro Concesionario");
  });

  it("antes de elegir no pide el inventario de NADIE", async () => {
    red({ contexto: dos() });

    montar();

    await screen.findByTestId("inventario-selector-dealer");
    expect(rutasDeVehiculos()).toEqual([]);
  });

  it("al elegir, la peticion sale con ESE dealer y no con el primero", async () => {
    red({ contexto: dos() });

    montar();

    await screen.findByTestId("inventario-selector-dealer");
    screen.getByRole("button", { name: "Otro Concesionario" }).click();

    await waitFor(() => {
      expect(rutasDeVehiculos()).toContain(`/api/v1/autos/dealers/${OTRO_DEALER}/vehicles`);
    });
    expect(rutasDeVehiculos()).not.toContain(`/api/v1/autos/dealers/${DEALER}/vehicles`);
  });

  it("la eleccion no persiste: ni localStorage ni sessionStorage", async () => {
    red({ contexto: dos() });

    montar();

    await screen.findByTestId("inventario-selector-dealer");
    screen.getByRole("button", { name: "Mapaal Autos" }).click();

    await waitFor(() => {
      expect(rutasDeVehiculos().length).toBe(1);
    });
    expect(window.localStorage.getItem("nadakki_dealer_id")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it("elegido, el selector desaparece y se pinta el inventario", async () => {
    red({
      contexto: dos(),
      vehiculos: [{ id: "v-1", make: "Toyota", model: "Corolla", year: "2021", status: "available" }],
    });

    montar();

    await screen.findByTestId("inventario-selector-dealer");
    screen.getByRole("button", { name: "Mapaal Autos" }).click();

    expect(await screen.findByText("2021 Toyota Corolla")).toBeInTheDocument();
    expect(screen.queryByTestId("inventario-selector-dealer")).toBeNull();
  });
});

describe("cero asignaciones y errores", () => {
  it("con cero, el estado de siempre: sin dealer y sin enlace", async () => {
    red({ contexto: respuesta(200, { assignments: [] }) });

    montar();

    const aviso = await screen.findByTestId("inventario-sin-dealer");
    expect(aviso.querySelector("a")).toBeNull();
    expect(rutasDeVehiculos()).toEqual([]);
  });

  it("un error leyendo las asignaciones se dice, sin inventar un dealer", async () => {
    red({ contexto: respuesta(403, { reason_code: "no_beneficiary_entitlement" }) });

    montar();

    const aviso = await screen.findByTestId("inventario-asignaciones-error");
    expect(aviso).toHaveTextContent("no_beneficiary_entitlement");
    expect(rutasDeVehiculos()).toEqual([]);
    expect(document.body.textContent).not.toContain("DEFAULT_DENY");
  });
});
