/**
 * El dealer sale del backend, y con varias asignaciones NO se elige.
 *
 * Contrato verificado en produccion y en `origin/main`:
 *
 *   GET /api/v1/autos/me/dealer-context
 *   -> 200 {"assignments": [{dealer_id, organization_unit_id, dealer_name}]}
 *
 * El caso que mas importa no es el feliz: es el de varias asignaciones. Elegir
 * `assignments[0]` le ensenaria a alguien el inventario de OTRO concesionario, y
 * el propio backend devuelve todas para no tener que elegir. La mutacion de abajo
 * lo fija.
 *
 * Los UUID de los fixtures son los de Mapaal, y viven SOLO aqui: en el codigo no
 * hay ningun identificador escrito a mano.
 */
import {
  DEALER_CONTEXT_PATH,
  DealerContextShapeError,
  fetchMyDealerContext,
  parseDealerAssignments,
  syncDealerContextFromBackend,
} from "@/lib/dealer/dealer-context-api";
import { resolveDealerAccessContext, resetDealerAccessMemoryForTests } from "@/lib/dealer/access-context";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const TENANT = "tenant-mapaal";
const DEALER = "1bc6a6cd-2592-442a-9d70-2d1b630762fc";
const UNIDAD = "ae4eab3a-733b-44d9-a573-1ee21dc9e631";
const OTRO_DEALER = "2cd7b7de-3603-553b-a81e-3e32c741873d";

/** Cuerpo tal como lo devuelve el SELECT de autos_portal_router.py:940-952. */
function cuerpo(assignments: unknown[]) {
  return { assignments };
}

function asignacion(dealerId: string, unidad: string | null = UNIDAD, nombre = "Mapaal Autos") {
  return { dealer_id: dealerId, organization_unit_id: unidad, dealer_name: nombre };
}

function responde(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response);
}

function bindingGuardado() {
  return {
    dealerId: window.localStorage.getItem("nadakki_dealer_id"),
    organizationUnitId: window.localStorage.getItem("nadakki_organization_unit_id"),
  };
}

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  fetchMock.mockReset();
  window.localStorage.setItem("nadakki_tenant_id", TENANT);
});

describe("parseo estricto", () => {
  it("lee los tres campos del contrato", () => {
    expect(parseDealerAssignments(cuerpo([asignacion(DEALER)]))).toEqual([
      { dealerId: DEALER, organizationUnitId: UNIDAD, dealerName: "Mapaal Autos" },
    ]);
  });

  it("acepta unidad null, que es lo que el contrato permite", () => {
    expect(parseDealerAssignments(cuerpo([asignacion(DEALER, null)]))[0]!.organizationUnitId).toBeNull();
  });

  it("lista vacia es una respuesta valida, no un error", () => {
    expect(parseDealerAssignments(cuerpo([]))).toEqual([]);
  });

  it("assignments que no es array revienta en vez de pasar a medias", () => {
    expect(() => parseDealerAssignments({ assignments: "nada" })).toThrow(DealerContextShapeError);
    expect(() => parseDealerAssignments({})).toThrow(DealerContextShapeError);
    expect(() => parseDealerAssignments(null)).toThrow(DealerContextShapeError);
  });

  it("una asignacion sin dealer_id utilizable revienta", () => {
    for (const malo of [{}, { dealer_id: "" }, { dealer_id: "   " }, { dealer_id: 42 }]) {
      expect(() => parseDealerAssignments(cuerpo([malo]))).toThrow(DealerContextShapeError);
    }
  });

  it("una unidad que no es string ni null revienta", () => {
    expect(() => parseDealerAssignments(cuerpo([{ dealer_id: DEALER, organization_unit_id: 7 }]))).toThrow(
      DealerContextShapeError,
    );
  });

  it("dealer_name ausente no invalida la asignacion: es informativo", () => {
    expect(parseDealerAssignments(cuerpo([{ dealer_id: DEALER, organization_unit_id: UNIDAD }]))[0]!.dealerName).toBeNull();
  });
});

describe("fetchMyDealerContext", () => {
  it("pide la ruta del contrato, sin parametros: tenant y usuario van en el token", async () => {
    responde(200, cuerpo([asignacion(DEALER)]));
    await fetchMyDealerContext();
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe(DEALER_CONTEXT_PATH);
    expect(path).toBe("/api/v1/autos/me/dealer-context");
    expect(init?.method ?? "GET").toBe("GET");
  });

  it("un error HTTP se propaga con su reason_code", async () => {
    responde(403, { reason_code: "no_organization_unit" });
    await expect(fetchMyDealerContext()).rejects.toMatchObject({
      status: 403,
      reason_code: "no_organization_unit",
    });
  });
});

describe("una sola asignacion", () => {
  it("escribe el binding con el dealer y la unidad del backend", async () => {
    responde(200, cuerpo([asignacion(DEALER)]));
    const salida = await syncDealerContextFromBackend(TENANT);
    expect(salida).toEqual({
      estado: "sincronizado",
      assignment: { dealerId: DEALER, organizationUnitId: UNIDAD, dealerName: "Mapaal Autos" },
    });
    expect(bindingGuardado()).toEqual({ dealerId: DEALER, organizationUnitId: UNIDAD });
  });

  it("y el contexto queda resuelto: es lo que desbloquea las pantallas", async () => {
    responde(200, cuerpo([asignacion(DEALER)]));
    await syncDealerContextFromBackend(TENANT);
    const resuelto = resolveDealerAccessContext();
    expect(resuelto.status).toBe("ready");
  });

  it("con unidad null escribe el dealer igual: la unidad la resuelve el backend", async () => {
    responde(200, cuerpo([asignacion(DEALER, null)]));
    expect((await syncDealerContextFromBackend(TENANT)).estado).toBe("sincronizado");
    expect(bindingGuardado().dealerId).toBe(DEALER);
  });
});

describe("cero asignaciones", () => {
  it("borra el binding y lo informa", async () => {
    window.localStorage.setItem("nadakki_dealer_id", "dealer-viejo");
    window.localStorage.setItem("nadakki_organization_unit_id", "unidad-vieja");
    responde(200, cuerpo([]));
    expect(await syncDealerContextFromBackend(TENANT)).toEqual({ estado: "sin_asignacion" });
    expect(bindingGuardado()).toEqual({ dealerId: null, organizationUnitId: null });
  });
});

describe("varias asignaciones", () => {
  it("NUNCA elige la primera", async () => {
    responde(200, cuerpo([asignacion(DEALER), asignacion(OTRO_DEALER, UNIDAD, "Otro Concesionario")]));
    const salida = await syncDealerContextFromBackend(TENANT);
    expect(salida).toEqual({ estado: "multiples", total: 2 });
    expect(bindingGuardado().dealerId).not.toBe(DEALER);
    expect(bindingGuardado().dealerId).not.toBe(OTRO_DEALER);
  });

  it("borra el binding, para que no quede uno de una sesion anterior", async () => {
    window.localStorage.setItem("nadakki_dealer_id", "dealer-viejo");
    responde(200, cuerpo([asignacion(DEALER), asignacion(OTRO_DEALER)]));
    await syncDealerContextFromBackend(TENANT);
    expect(bindingGuardado()).toEqual({ dealerId: null, organizationUnitId: null });
  });

  it("con tres tampoco elige", async () => {
    responde(200, cuerpo([asignacion(DEALER), asignacion(OTRO_DEALER), asignacion("3de8c8ef-4714-664c-b92f-4f43d852984e")]));
    expect(await syncDealerContextFromBackend(TENANT)).toEqual({ estado: "multiples", total: 3 });
  });
});

describe("errores: no se escribe ni se borra nada", () => {
  it("un 500 devuelve el estado con su status y no toca el binding", async () => {
    window.localStorage.setItem("nadakki_dealer_id", DEALER);
    window.localStorage.setItem("nadakki_organization_unit_id", UNIDAD);
    responde(500, { detail: "boom" });
    const salida = await syncDealerContextFromBackend(TENANT);
    expect(salida).toMatchObject({ estado: "error_http", status: 500 });
    expect(bindingGuardado()).toEqual({ dealerId: DEALER, organizationUnitId: UNIDAD });
  });

  it("un 403 lleva el reason_code REAL, no uno fabricado", async () => {
    responde(403, { reason_code: "no_beneficiary_entitlement" });
    expect(await syncDealerContextFromBackend(TENANT)).toEqual({
      estado: "error_http",
      reason_code: "no_beneficiary_entitlement",
      status: 403,
    });
  });

  it("un error sin reason_code lo deja en null en vez de inventarlo", async () => {
    responde(500, {});
    const salida = await syncDealerContextFromBackend(TENANT);
    expect(salida).toMatchObject({ estado: "error_http", reason_code: null });
    expect(JSON.stringify(salida)).not.toContain("DEFAULT_DENY");
  });

  it("una forma invalida no escribe nada", async () => {
    window.localStorage.setItem("nadakki_dealer_id", DEALER);
    responde(200, { assignments: "nada" });
    expect((await syncDealerContextFromBackend(TENANT)).estado).toBe("forma_invalida");
    expect(bindingGuardado().dealerId).toBe(DEALER);
  });

  it("sin tenant en la sesion no se escribe el binding", async () => {
    responde(200, cuerpo([asignacion(DEALER)]));
    expect(await syncDealerContextFromBackend(null)).toEqual({ estado: "sin_tenant" });
    expect(bindingGuardado()).toEqual({ dealerId: null, organizationUnitId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
