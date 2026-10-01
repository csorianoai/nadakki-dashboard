/**
 * AR_NOT_CONFIGURED se cuenta como "se gestiona en ARCA", nunca como error.
 *
 * Contrato medido sobre `origin/main` de nadakki-ai-suite (#1497, fad45670):
 * `require_rd_fiscal` convierte cualquier `FiscalDispatchError` en
 *
 *   HTTP 409  {"detail": {"error": "<codigo>", "country": "<pais|null>"}}
 *
 * El caso que mas importa no es el feliz: es que los OTROS tres codigos NO se
 * disfracen de ARCA. Un tenant sin pais fiscal tiene un problema real de
 * configuracion, y decirle "se gestiona en ARCA" lo dejaria sin arreglar.
 */
import {
  ARCA_TITULO,
  FISCAL_DISPATCH_CODES,
  FISCAL_PATH,
  esInformativo,
  estadoFiscalDesdeRespuesta,
  fetchEstadoFiscal,
  leeCuerpoFiscal,
} from "@/lib/contable/fiscal-dispatch";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

/** Cuerpo exacto que produce `HTTPException(409, {"error": ..., "country": ...})`. */
function cuerpo409(error: string, country: string | null) {
  return { detail: { error, country } };
}

describe("texto de producto", () => {
  it("es la frase pedida, palabra por palabra", () => {
    expect(ARCA_TITULO).toBe("Facturación electrónica: se gestiona en ARCA");
  });
});

describe("leeCuerpoFiscal", () => {
  it("lee el detail que envuelve FastAPI", () => {
    expect(leeCuerpoFiscal(cuerpo409("AR_NOT_CONFIGURED", "AR"))).toEqual({
      codigo: "AR_NOT_CONFIGURED",
      pais: "AR",
    });
  });

  it("tolera la forma plana por si un proxy desenvuelve el detail", () => {
    expect(leeCuerpoFiscal({ error: "AR_NOT_CONFIGURED", country: "AR" }).codigo).toBe("AR_NOT_CONFIGURED");
  });

  it("un cuerpo que no trae codigo no se rellena con uno inventado", () => {
    expect(leeCuerpoFiscal(null)).toEqual({ codigo: null, pais: null });
    expect(leeCuerpoFiscal({})).toEqual({ codigo: null, pais: null });
    expect(leeCuerpoFiscal({ detail: { country: null } }).codigo).toBeNull();
  });
});

describe("AR_NOT_CONFIGURED", () => {
  const estado = estadoFiscalDesdeRespuesta(409, cuerpo409("AR_NOT_CONFIGURED", "AR"));

  it("se traduce al aviso de ARCA", () => {
    expect(estado.tipo).toBe("arca");
    expect(estado).toMatchObject({ titulo: ARCA_TITULO });
  });

  it("cuenta como informativo, no como incidencia", () => {
    expect(esInformativo(estado)).toBe(true);
  });

  it("el texto no filtra el codigo, el 409 ni la palabra error", () => {
    const visible = `${(estado as { titulo: string }).titulo} ${(estado as { detalle: string }).detalle}`;
    expect(visible).not.toContain("AR_NOT_CONFIGURED");
    expect(visible).not.toContain("409");
    expect(visible).not.toMatch(/\berror\b/i);
  });

  it("dice que no hay nada que configurar, para que nadie lo persiga", () => {
    expect((estado as { detalle: string }).detalle).toContain("ARCA");
    expect((estado as { detalle: string }).detalle).toContain("no hay nada que configurar");
  });
});

describe("los otros codigos NO se disfrazan de ARCA", () => {
  it("un tenant sin pais fiscal es un problema real de configuracion", () => {
    const estado = estadoFiscalDesdeRespuesta(
      409,
      cuerpo409(FISCAL_DISPATCH_CODES.FISCAL_COUNTRY_NOT_CONFIGURED, null),
    );
    expect(estado.tipo).toBe("sin_pais");
    expect(esInformativo(estado)).toBe(false);
    expect(JSON.stringify(estado)).not.toContain("ARCA");
  });

  it("un pais sin paquete fiscal se nombra, no se confunde con AR", () => {
    const estado = estadoFiscalDesdeRespuesta(
      409,
      cuerpo409(FISCAL_DISPATCH_CODES.FISCAL_COUNTRY_UNSUPPORTED, "CO"),
    );
    expect(estado).toMatchObject({ tipo: "pais_sin_paquete", pais: "CO" });
    expect(JSON.stringify(estado)).not.toContain("ARCA");
  });

  it("TENANT_NOT_FOUND llega como error con su codigo", () => {
    const estado = estadoFiscalDesdeRespuesta(409, cuerpo409(FISCAL_DISPATCH_CODES.TENANT_NOT_FOUND, null));
    expect(estado).toMatchObject({ tipo: "error", codigo: "TENANT_NOT_FOUND" });
  });

  it("un 409 sin codigo tampoco se lee como ARCA", () => {
    expect(estadoFiscalDesdeRespuesta(409, {}).tipo).toBe("error");
  });

  it("un 500 no es ARCA aunque el cuerpo traiga el codigo", () => {
    const estado = estadoFiscalDesdeRespuesta(500, cuerpo409("AR_NOT_CONFIGURED", "AR"));
    expect(estado).toMatchObject({ tipo: "error", status: 500 });
  });

  it("un 403 se ve con su codigo, no silenciado", () => {
    expect(estadoFiscalDesdeRespuesta(403, { detail: "denegado" })).toMatchObject({
      tipo: "error",
      codigo: "HTTP_403",
    });
  });
});

describe("respuesta correcta del paquete RD", () => {
  it("un 200 es RD operativo", () => {
    const estado = estadoFiscalDesdeRespuesta(200, []);
    expect(estado.tipo).toBe("rd");
    expect(esInformativo(estado)).toBe(true);
  });

  it("un 201 tambien", () => {
    expect(estadoFiscalDesdeRespuesta(201, {}).tipo).toBe("rd");
  });
});

describe("fetchEstadoFiscal", () => {
  beforeEach(() => fetchMock.mockReset());

  it("pide la superficie fiscal con el tenant en cabecera", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] } as unknown as Response);
    await expect(fetchEstadoFiscal("tenant-a")).resolves.toEqual({ tipo: "rd" });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe(FISCAL_PATH);
    expect(path).toBe("/api/v1/contable/fiscal/documents");
    expect((init?.headers as Record<string, string>)["X-Tenant-ID"]).toBe("tenant-a");
  });

  it("el 409 de AR no se lanza como excepcion: es un estado de pantalla", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => cuerpo409("AR_NOT_CONFIGURED", "AR"),
    } as unknown as Response);
    await expect(fetchEstadoFiscal("tenant-a")).resolves.toMatchObject({ tipo: "arca" });
  });

  it("un cuerpo que no es JSON no rompe la lectura", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => {
        throw new Error("sin json");
      },
    } as unknown as Response);
    await expect(fetchEstadoFiscal("tenant-a")).resolves.toMatchObject({ tipo: "error" });
  });
});
