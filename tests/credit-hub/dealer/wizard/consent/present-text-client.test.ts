import { ConsentApiClient, ConsentApiError } from "@/lib/credit-hub/api/consent-client";

const CAMPOS = {
  NOMBRE_TITULAR: "Ana Pérez",
  CEDULA: "000-0000000-0",
  NOMBRE_CONCESIONARIO: "Concesionario Prueba",
  VEHICULO: "Toyota Corolla 2022",
  LISTA_ENTIDADES: "Entidad A",
  CONTACTO_DERECHOS: "derechos@example.invalid",
  LUGAR: "Santo Domingo",
  FECHA: "20/10/2026",
};

function decodeHeader(raw: string): unknown {
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
}

describe("ConsentApiClient.fetchPresentText (DB-CODEX-16 paso 4)", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("pide GET /{id}/present/text con los datos en X-Consent-Fields (base64url) y devuelve el texto v1.0", async () => {
    const body = { consent_text: "Versión 1.0 — texto", consent_text_version: "1.0", filled_text_sha256: "abc" };
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: "OK", clone: () => ({ json: async () => body }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await new ConsentApiClient("tenant-qa").fetchPresentText("app-1", CAMPOS);

    expect(res.consent_text).toBe("Versión 1.0 — texto");
    expect(res.consent_text_version).toBe("1.0");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v2/credit/consent/app-1/present/text");
    expect(init.method).toBe("GET");
    const raw = init.headers["X-Consent-Fields"] as string;
    expect(raw).not.toMatch(/[+/=]/);
    expect(decodeHeader(raw)).toEqual(CAMPOS);
    expect(url).not.toContain("CEDULA");
  });

  it("un 409 con detail.code se tipa como ConsentApiError con el código y los campos que faltan", async () => {
    const body = { detail: { code: "consent_text_incomplete", missing: ["LISTA_ENTIDADES"] } };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 409, statusText: "Conflict", clone: () => ({ json: async () => body }) }) as unknown as typeof fetch;

    const err = await new ConsentApiClient("tenant-qa").fetchPresentText("app-1", CAMPOS).catch((e) => e);
    expect(err).toBeInstanceOf(ConsentApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("consent_text_incomplete");
    expect(err.missing).toEqual(["LISTA_ENTIDADES"]);
  });

  it("un 404 se tipa como ConsentApiError con status 404", async () => {
    const body = { detail: "Application not found" };
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found", clone: () => ({ json: async () => body }) }) as unknown as typeof fetch;
    const err = await new ConsentApiClient("tenant-qa").fetchPresentText("app-1", CAMPOS).catch((e) => e);
    expect(err).toBeInstanceOf(ConsentApiError);
    expect(err.status).toBe(404);
  });
});
