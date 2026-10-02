/**
 * @jest-environment node
 */

/**
 * El proxy BFF no reescribe el cuerpo de error del backend (D8, suite#1501).
 *
 * Corre en `node` y no en `jsdom`: el proxy es una ruta de servidor y necesita
 * los globales `Request`/`Response` de verdad, que jsdom no trae.
 *
 * Medido en produccion antes del arreglo:
 *
 *   directo  api.nadakki.com/api/v1/contable/fiscal/documents
 *            {"detail":"missing_auth"}
 *   proxy    dashboard.nadakki.com/api/v1/contable/fiscal/documents
 *            {"error":"Upstream error 401","details":"{\"detail\":\"missing_auth\"}"}
 *
 * El `detail` dejaba de ser un campo y pasaba a ser texto dentro de `details`,
 * asi que ningun codigo de dominio del backend sobrevivia al salto. El caso que
 * lo delato: un tenant argentino recibe `409 AR_NOT_CONFIGURED`, que no es un
 * fallo, y la pantalla lo pintaba como "codigo: Upstream error 409" en vez de
 * "se gestiona en ARCA".
 *
 * El test de abajo recorre el camino completo --proxy y luego el dispatcher
 * fiscal-- porque el fallo vivia justo en la costura: las dos piezas pasaban
 * sus tests por separado.
 */

import { NextRequest } from "next/server";
import { estadoFiscalDesdeRespuesta } from "@/lib/contable/fiscal-dispatch";

const BACKEND = "https://api.nadakki.test";

process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

/** Cuerpo exacto de `require_rd_fiscal` para un tenant AR (backend #1497). */
const CUERPO_409_AR = JSON.stringify({
  detail: { error: "AR_NOT_CONFIGURED", country: "AR" },
});

type Upstream = { status: number; body: string; contentType?: string };

function mockUpstream({ status, body, contentType = "application/json" }: Upstream) {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(body, { status, headers: { "Content-Type": contentType } }),
  ) as unknown as typeof fetch;
}

function peticion(path: string): NextRequest {
  return new NextRequest(`https://dashboard.nadakki.test/api/v1/${path}`, {
    method: "GET",
    headers: { Authorization: "Bearer t", "X-Tenant-ID": "11111111-1111-1111-1111-111111111111" },
  });
}

describe("el proxy BFF reenvia el error del backend tal cual", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("v1: un 409 llega con su `detail` intacto, no como 'Upstream error 409'", async () => {
    mockUpstream({ status: 409, body: CUERPO_409_AR });
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const res = await GET(peticion("contable/fiscal/documents"), {
      params: Promise.resolve({ path: ["contable", "fiscal", "documents"] }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ detail: { error: "AR_NOT_CONFIGURED", country: "AR" } });
    // Lo que hacia antes, y que no debe volver:
    expect(body.error).toBeUndefined();
    expect(body.details).toBeUndefined();
  });

  test("v1: el 401 conserva `detail`, que es lo que distingue un token muerto", async () => {
    mockUpstream({ status: 401, body: JSON.stringify({ detail: "missing_auth" }) });
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const res = await GET(peticion("contable/periodos"), {
      params: Promise.resolve({ path: ["contable", "periodos"] }),
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: "missing_auth" });
  });

  test("v1: un 502 con cuerpo no-JSON se reenvia sin inventarle un JSON", async () => {
    mockUpstream({ status: 502, body: "upstream down", contentType: "text/plain" });
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const res = await GET(peticion("contable/periodos"), {
      params: Promise.resolve({ path: ["contable", "periodos"] }),
    });

    expect(res.status).toBe(502);
    expect(await res.text()).toBe("upstream down");
  });

  test("v2: la superficie de sesion tambien conserva el cuerpo del backend", async () => {
    mockUpstream({ status: 401, body: JSON.stringify({ detail: "token_revoked" }) });
    const { GET } = await import("@/app/api/v2/[[...path]]/route");

    const res = await GET(
      new NextRequest("https://dashboard.nadakki.test/api/v2/auth/me", { method: "GET" }),
      { params: Promise.resolve({ path: ["auth", "me"] }) },
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: "token_revoked" });
  });

  test("el 200 sigue pasando sin tocar", async () => {
    mockUpstream({ status: 200, body: JSON.stringify({ documents: [] }) });
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const res = await GET(peticion("contable/fiscal/documents"), {
      params: Promise.resolve({ path: ["contable", "fiscal", "documents"] }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ documents: [] });
  });
});

describe("y con el cuerpo intacto el aviso de ARCA ya es alcanzable", () => {
  test("el 409 del proxy se traduce a 'arca', no a 'error'", async () => {
    mockUpstream({ status: 409, body: CUERPO_409_AR });
    const { GET } = await import("@/app/api/v1/[[...path]]/route");

    const res = await GET(peticion("contable/fiscal/documents"), {
      params: Promise.resolve({ path: ["contable", "fiscal", "documents"] }),
    });

    // Lo mismo que hace fetchEstadoFiscal con la respuesta del proxy.
    const estado = estadoFiscalDesdeRespuesta(res.status, await res.json());

    expect(estado.tipo).toBe("arca");
    jest.resetAllMocks();
  });

  test("el cuerpo reescrito de antes daba 'error' con el codigo opaco", () => {
    // Regresion documentada: esta era la respuesta que recibia produccion.
    const reescrito = {
      error: "Upstream error 409",
      details: CUERPO_409_AR,
    };
    const estado = estadoFiscalDesdeRespuesta(409, reescrito);

    expect(estado.tipo).toBe("error");
    expect(estado).toMatchObject({ codigo: "Upstream error 409" });
  });
});
