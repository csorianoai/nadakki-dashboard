/**
 * La parte pura del guion D1 (e2e/mapaal/d1-red.ts): si esto falla, el spec de
 * Playwright daria PASS o FAIL por motivos equivocados.
 */
import {
  TENANT_QA,
  fallosDeCronologia,
  interesa,
  RETENCION_MAX_MS,
  leerAsignacionUnica,
  mensajeSinPeticion,
  pathOf,
  type Evento,
} from "../../e2e/mapaal/d1-red";

const API = "https://api.nadakki.com";
const CONTEXTO = "/api/v1/autos/me/dealer-context";
const vehiculos = (id: string) => `/api/v1/autos/dealers/${id}/vehicles`;

function ev(tipo: Evento["tipo"], ruta: string, seq: number): Evento {
  return { tipo, ruta, url: `${API}${ruta}`, seq };
}

describe("D1 red: que URLs interesan", () => {
  it("dealer-context y /vehicles, con o sin query; nada mas", () => {
    expect(interesa(`${API}${CONTEXTO}`)).toBe(true);
    expect(interesa(`${API}${vehiculos("d-1")}?page=1`)).toBe(true);
    expect(interesa(`${API}/api/v1/autos/dealers/d-1/vehicles/v-9`)).toBe(false);
    expect(interesa(`${API}/api/v1/autos/me/dealer-context-extra`)).toBe(false);
    expect(interesa(`${API}/api/v1/auth/me`)).toBe(false);
  });

  it("pathOf quita host y query, y deja intacto lo que no es URL", () => {
    expect(pathOf(`${API}${CONTEXTO}?x=1`)).toBe(CONTEXTO);
    expect(pathOf("no-es-url")).toBe("no-es-url");
  });

  it("el tenant QA es el de fase2.json, no otro", () => {
    expect(TENANT_QA).toBe("9a9a0001-0000-4000-8000-000000000001");
  });
});

describe("D1 red: leerAsignacionUnica", () => {
  it("una asignacion: dealer y unidad", () => {
    expect(leerAsignacionUnica({ assignments: [{ dealer_id: "d-1", organization_unit_id: "u-1" }] })).toEqual({
      ok: true,
      dealerId: "d-1",
      unidad: "u-1",
    });
  });

  it("una asignacion sin unidad: unidad null", () => {
    expect(leerAsignacionUnica({ assignments: [{ dealer_id: "d-1", organization_unit_id: null }] })).toEqual({
      ok: true,
      dealerId: "d-1",
      unidad: null,
    });
  });

  it.each([
    ["sin cuerpo", null],
    ["sin assignments", {}],
    ["cero asignaciones", { assignments: [] }],
    ["dos asignaciones", { assignments: [{ dealer_id: "d-1" }, { dealer_id: "d-2" }] }],
    ["sin dealer_id", { assignments: [{ organization_unit_id: "u-1" }] }],
  ])("%s: no ok", (_nombre, body) => {
    expect(leerAsignacionUnica(body).ok).toBe(false);
  });
});

describe("D1 red: fallosDeCronologia", () => {
  it("dealer-context, su respuesta y luego /vehicles con ese dealer: sin fallos", () => {
    const eventos = [ev("request", CONTEXTO, 0), ev("response", CONTEXTO, 1), ev("request", vehiculos("d-1"), 2)];
    expect(fallosDeCronologia(eventos, "d-1")).toEqual([]);
  });

  it("/vehicles antes de que dealer-context responda", () => {
    const eventos = [ev("request", CONTEXTO, 0), ev("request", vehiculos("d-1"), 1), ev("response", CONTEXTO, 2)];
    expect(fallosDeCronologia(eventos, "d-1")).toEqual(["/vehicles salio antes de que dealer-context respondiera"]);
  });

  it("/vehicles con otro dealer", () => {
    const eventos = [ev("request", CONTEXTO, 0), ev("response", CONTEXTO, 1), ev("request", vehiculos("d-2"), 2)];
    expect(fallosDeCronologia(eventos, "d-1")).toEqual(["/vehicles con dealer_id d-2 (el contrato dice d-1)"]);
  });

  it("dos peticiones a dealer-context", () => {
    const eventos = [
      ev("request", CONTEXTO, 0),
      ev("response", CONTEXTO, 1),
      ev("request", CONTEXTO, 2),
      ev("request", vehiculos("d-1"), 3),
    ];
    expect(fallosDeCronologia(eventos, "d-1")).toEqual(["dealer-context pedido 2 veces (debe ser 1)"]);
  });

  it("sin /vehicles", () => {
    const eventos = [ev("request", CONTEXTO, 0), ev("response", CONTEXTO, 1)];
    expect(fallosDeCronologia(eventos, "d-1")).toEqual(["con dealer resuelto tiene que salir la peticion a /vehicles"]);
  });

  it("dealer-context que no termina", () => {
    expect(fallosDeCronologia([ev("request", CONTEXTO, 0)], "d-1")).toContain("dealer-context no termino");
  });

  it("dealer_id codificado en la URL se compara decodificado", () => {
    const eventos = [ev("request", CONTEXTO, 0), ev("response", CONTEXTO, 1), ev("request", vehiculos("d%201"), 2)];
    expect(fallosDeCronologia(eventos, "d 1")).toEqual([]);
  });
});

describe("D1 red: retencion de dealer-context", () => {
  it("el tope de seguridad es 60 s, no 2 s fijos", () => {
    expect(RETENCION_MAX_MS).toBe(60_000);
  });

  it("el mensaje de fallo incluye la URL de la pagina", () => {
    expect(mensajeSinPeticion("https://mapaal.nadakki.com/login")).toContain("https://mapaal.nadakki.com/login");
  });
});
