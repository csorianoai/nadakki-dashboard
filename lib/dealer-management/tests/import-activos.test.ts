/** Contrato D7 con la forma REAL de P5: no ofrecer aplicar con errores, tenant fuera del cliente, 422 leído como revisión. */
import {
  IMPORT_CAPABILITY_KEYS,
  ImportRechazado,
  erroresDeArchivo,
  filasTotales,
  importActivosPath,
  parseImportResultado,
  postImportActivos,
  puedeAplicar,
  validarArchivo,
} from "@/lib/dealer-management/import-activos";
import { AccessApiError } from "@/lib/access/client";
import { MIGRATION_097_CAPABILITY_KEYS } from "@/lib/dealer/core-status";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

const REVISION_OK = {
  ok: true,
  vehiculos: 2,
  costos: 3,
  incidencias: [{ hoja: "Vehiculos", fila: 4, codigo: "COLUMNA_PROXIMAMENTE", detalle: "dominio no se guarda", nivel: "AVISO" }],
  aplicado: false,
};
const ERROR_FILA = { hoja: "Costos_vehiculos", fila: 5, codigo: "MONTO_INVALIDO", detalle: "m", nivel: "ERROR" };

function respuesta(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

beforeEach(() => fetchMock.mockReset());

describe("capabilities", () => {
  it("son claves del catalogo 097, no inventadas", () => {
    for (const key of IMPORT_CAPABILITY_KEYS) expect(MIGRATION_097_CAPABILITY_KEYS.has(key)).toBe(true);
  });
});

describe("validarArchivo", () => {
  it("acepta la plantilla .xlsx y el .zip de CSV", () => {
    expect(validarArchivo({ name: "Plantilla_Activos_Mapaal_v4.xlsx", size: 10 })).toBeNull();
    expect(validarArchivo({ name: "Plantilla_Activos_Mapaal_v4_CSV.ZIP", size: 10 })).toBeNull();
  });

  it("rechaza sin archivo, otra extension o vacio", () => {
    expect(validarArchivo(null)).toMatch(/Elegí/);
    expect(validarArchivo({ name: "stock.csv", size: 10 })).toMatch(/\.xlsx/);
    expect(validarArchivo({ name: "stock.xls", size: 10 })).toMatch(/\.xlsx/);
    expect(validarArchivo({ name: "p.xlsx", size: 0 })).toMatch(/vacío/);
  });
});

describe("parseImportResultado", () => {
  it("lee conteos, errores y avisos", () => {
    const r = parseImportResultado(REVISION_OK, "revision")!;
    expect(r.hojas).toEqual([
      { hoja: "Vehiculos", filas: 2 },
      { hoja: "Costos_vehiculos", filas: 3 },
    ]);
    expect(r.avisos).toEqual([{ hoja: "Vehiculos", fila: 4, codigo: "COLUMNA_PROXIMAMENTE", mensaje: "dominio no se guarda" }]);
    expect(r.errores).toEqual([]);
    expect(filasTotales(r)).toBe(5);
  });

  it("un 422 trae la revision dentro de detail y se lee igual", () => {
    const r = parseImportResultado({ detail: { ...REVISION_OK, ok: false, incidencias: [ERROR_FILA] } }, "revision")!;
    expect(r.errores).toEqual([{ hoja: "Costos_vehiculos", fila: 5, codigo: "MONTO_INVALIDO", mensaje: "m" }]);
  });

  it("un conteo ausente no se pinta con un cero inventado y bloquea", () => {
    const r = parseImportResultado({ ok: true, vehiculos: 2, costos: "x", incidencias: [] }, "revision")!;
    expect(r.hojas).toEqual([{ hoja: "Vehiculos", filas: 2 }]);
    expect(r.hojasIlegibles).toBe(1);
    expect(puedeAplicar(r)).toBe(false);
  });

  it("un error mudo sigue contando", () => {
    const r = parseImportResultado({ ok: false, vehiculos: 0, costos: 0, incidencias: [{ nivel: "ERROR" }] }, "revision")!;
    expect(r.errores).toHaveLength(1);
    expect(erroresDeArchivo(r)).toHaveLength(1);
  });

  it("un elemento ilegible en incidencias cuenta como error", () => {
    const r = parseImportResultado({ ...REVISION_OK, incidencias: [123, null, [], ""] }, "revision")!;
    expect(r.errores).toHaveLength(4);
    expect(puedeAplicar(r)).toBe(false);
  });

  it("un cuerpo sin nada del contrato es ilegible, no una revision vacia", () => {
    expect(parseImportResultado({ detail: "Not Found" })).toBeNull();
    expect(parseImportResultado({ detail: [{ loc: ["body", "file"], msg: "Field required" }] })).toBeNull();
    expect(parseImportResultado(null)).toBeNull();
  });
});

describe("puedeAplicar es fail-closed", () => {
  const base = parseImportResultado(REVISION_OK, "revision")!;

  it("revision limpia con filas: si (los avisos no bloquean)", () => {
    expect(puedeAplicar(base)).toBe(true);
  });

  it("con un error de fila, de archivo, ok=false, sin filas o ya aplicada: no", () => {
    const error = { hoja: "Costos_vehiculos", fila: 5, codigo: null, mensaje: "m" };
    expect(puedeAplicar({ ...base, errores: [error] })).toBe(false);
    expect(puedeAplicar({ ...base, errores: [{ ...error, fila: null }] })).toBe(false);
    expect(puedeAplicar({ ...base, ok: false })).toBe(false);
    expect(puedeAplicar({ ...base, hojas: [] })).toBe(false);
    expect(puedeAplicar({ ...base, modo: "aplicar" })).toBe(false);
    expect(puedeAplicar({ ...base, aplicado: true })).toBe(false);
    expect(puedeAplicar(null)).toBe(false);
  });
});

describe("postImportActivos", () => {
  const archivo = new Blob(["xlsx"]);

  it("manda multipart al dealer, sin tenant del cliente ni Content-Type a mano", async () => {
    fetchMock.mockResolvedValue(respuesta(200, REVISION_OK));
    await postImportActivos("dealer a", archivo, "p.xlsx", "revision");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/dealers/dealer%20a/import-activos?aplicar=false");
    expect(path).not.toMatch(/tenant/i);
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("X-Tenant-ID");
    expect(headers).not.toHaveProperty("Content-Type");
    const body = init?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get("file") as File).name).toBe("p.xlsx");
  });

  it("aplicar lleva la Idempotency-Key", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ...REVISION_OK, aplicado: true }));
    const r = await postImportActivos("d", archivo, "p.xlsx", "aplicar", "k-1");
    expect(importActivosPath("d", "aplicar")).toBe(fetchMock.mock.calls[0][0]);
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("k-1");
    expect(r.aplicado).toBe(true);
  });

  it("un 422 con revision es ImportRechazado, con sus filas", async () => {
    fetchMock.mockResolvedValue(
      respuesta(422, { detail: { reason_code: "REVISION_CON_ERRORES", ...REVISION_OK, ok: false, incidencias: [ERROR_FILA] } }),
    );
    const error = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(error).toBeInstanceOf(ImportRechazado);
    expect((error as ImportRechazado).resultado.errores[0].fila).toBe(5);
  });

  it("un aplicar que dice aplicado=false no es un exito", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ...REVISION_OK, aplicado: false }));
    await expect(postImportActivos("d", archivo, "p.xlsx", "aplicar", "k")).rejects.toBeInstanceOf(ImportRechazado);
  });

  it("403 y 2xx ilegible son errores de acceso con su status", async () => {
    fetchMock.mockResolvedValue(respuesta(403, { detail: { reason_code: "DEALER_NOT_ASSIGNED" } }));
    const denegado = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(denegado).toBeInstanceOf(AccessApiError);
    expect((denegado as AccessApiError).status).toBe(403);

    fetchMock.mockResolvedValue(respuesta(200, { detail: "x" }));
    const ilegible = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(ilegible).toBeInstanceOf(AccessApiError);
    expect((ilegible as AccessApiError).status).toBe(502);
  });
});

// Forma real de P5: ?aplicar=, campo `file`, { ok, vehiculos, costos, incidencias, aplicado, creados }.
describe("contrato real de P5", () => {
  const archivo = new Blob(["xlsx"]);
  const REAL_OK = {
    ok: true,
    vehiculos: 2,
    costos: 3,
    incidencias: [{ hoja: "Vehiculos", fila: 4, codigo: "COLUMNA_PROXIMAMENTE", detalle: "dominio no se guarda", nivel: "AVISO" }],
    aplicado: false,
  };

  it("una revision limpia del backend real se puede aplicar", () => {
    const r = parseImportResultado(REAL_OK, "revision")!;
    expect(r).not.toBeNull();
    expect(filasTotales(r)).toBe(5);
    expect(r.errores).toEqual([]);
    expect(r.avisos).toHaveLength(1);
    expect(puedeAplicar(r)).toBe(true);
  });

  it("ok=false o una incidencia ERROR (o de nivel desconocido) bloquea", () => {
    const err = { hoja: "Costos_vehiculos", fila: 9, codigo: "MONTO_INVALIDO", detalle: "x", nivel: "ERROR" };
    expect(puedeAplicar(parseImportResultado({ ...REAL_OK, ok: false, incidencias: [err] }, "revision"))).toBe(false);
    expect(puedeAplicar(parseImportResultado({ ...REAL_OK, incidencias: [err] }, "revision"))).toBe(false);
    expect(puedeAplicar(parseImportResultado({ ...REAL_OK, incidencias: [{ ...err, nivel: "?" }] }, "revision"))).toBe(false);
    expect(puedeAplicar(parseImportResultado({ ...REAL_OK, ok: undefined }, "revision"))).toBe(false);
  });

  it("el fichero ilegible (fila 0) es error de archivo", () => {
    const r = parseImportResultado(
      { ok: false, vehiculos: 0, costos: 0, aplicado: false, incidencias: [{ hoja: "-", fila: 0, codigo: "FICHERO_ILEGIBLE", detalle: "no es un .xlsx", nivel: "ERROR" }] },
      "revision",
    )!;
    expect(erroresDeArchivo(r)).toHaveLength(1);
    expect(r.errores[0].mensaje).toBe("no es un .xlsx");
  });

  it("un 422 de aplicar trae reason_code y la revision en detail", () => {
    const r = parseImportResultado(
      { detail: { reason_code: "REVISION_CON_ERRORES", error: "hay errores", ok: false, vehiculos: 1, costos: 0, incidencias: [] } },
      "aplicar",
    )!;
    expect(r).not.toBeNull();
    expect(r.aplicado).toBe(false);
  });

  it("manda ?aplicar=true|false y el campo multipart `file`", async () => {
    fetchMock.mockResolvedValue(respuesta(200, REAL_OK));
    await postImportActivos("d", archivo, "p.xlsx", "revision");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/autos/dealers/d/import-activos?aplicar=false");
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get("file")).not.toBeNull();
    fetchMock.mockResolvedValue(respuesta(200, { ...REAL_OK, aplicado: true, creados: { vehiculos: 2, costos: 3 } }));
    const r = await postImportActivos("d", archivo, "p.xlsx", "aplicar", "k");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/autos/dealers/d/import-activos?aplicar=true");
    expect(r.aplicado).toBe(true);
  });
});
