/**
 * Contrato del importador de la PLANTILLA_ACTIVOS_v4 (D7).
 *
 * Lo que se prueba es lo que escribe dinero de mas: que no se ofrezca aplicar
 * una revision con errores o de otra version, que el tenant no viaje desde el
 * cliente, y que un 422 se lea como la revision que es y no como "error 422".
 */
import {
  IMPORT_CAPABILITY_KEYS,
  ImportRechazado,
  PLANTILLA_VERSION,
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
  modo: "revision",
  version: PLANTILLA_VERSION,
  aplicado: false,
  hojas: [
    { hoja: "Vehiculos", filas: 2, crear: 1, actualizar: 1, archivar: 0 },
    { hoja: "Costos_vehiculos", filas: 3, crear: 3, apertura: 2, operacion: 1 },
  ],
  errores: [],
  no_aplicado: [{ hoja: "Vehiculos", columna: "dominio", motivo: "PROXIMAMENTE" }],
};

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
  it("lee hojas, errores y lo que no se aplica", () => {
    const r = parseImportResultado(REVISION_OK)!;
    expect(r.modo).toBe("revision");
    expect(r.hojas[1]).toEqual({
      hoja: "Costos_vehiculos",
      filas: 3,
      crear: 3,
      actualizar: null,
      archivar: null,
      apertura: 2,
      operacion: 1,
    });
    expect(r.noAplicado).toEqual([{ hoja: "Vehiculos", columna: "dominio", motivo: "PROXIMAMENTE" }]);
    expect(filasTotales(r)).toBe(5);
  });

  it("un 422 trae la revision dentro de detail y se lee igual", () => {
    const r = parseImportResultado({
      detail: { ...REVISION_OK, errores: [{ hoja: "Vehiculos", fila: 7, columna: "precio_venta", codigo: "X" }] },
    })!;
    expect(r.errores).toEqual([{ hoja: "Vehiculos", fila: 7, columna: "precio_venta", codigo: "X", mensaje: "X" }]);
  });

  it("una hoja sin conteo no se pinta con un cero inventado", () => {
    const r = parseImportResultado({ version: PLANTILLA_VERSION, hojas: [{ hoja: "Vehiculos" }, { filas: 3 }] })!;
    expect(r.hojas).toEqual([]);
  });

  it("un error mudo sigue contando", () => {
    const r = parseImportResultado({ version: PLANTILLA_VERSION, errores: [{}] })!;
    expect(r.errores).toHaveLength(1);
    expect(erroresDeArchivo(r)).toHaveLength(1);
  });

  it("un cuerpo sin nada del contrato es ilegible, no una revision vacia", () => {
    expect(parseImportResultado({ detail: "Not Found" })).toBeNull();
    expect(parseImportResultado(null)).toBeNull();
  });
});

describe("puedeAplicar es fail-closed", () => {
  const base = parseImportResultado(REVISION_OK)!;

  it("revision limpia de la v4 con filas: si", () => {
    expect(puedeAplicar(base)).toBe(true);
  });

  it("con un error de fila, de archivo, otra version, sin filas o ya aplicada: no", () => {
    const error = { hoja: "Costos_vehiculos", fila: 5, columna: null, codigo: null, mensaje: "m" };
    expect(puedeAplicar({ ...base, errores: [error] })).toBe(false);
    expect(puedeAplicar({ ...base, errores: [{ ...error, fila: null }] })).toBe(false);
    expect(puedeAplicar({ ...base, version: "PLANTILLA_ACTIVOS_v3" })).toBe(false);
    expect(puedeAplicar({ ...base, hojas: [] })).toBe(false);
    expect(puedeAplicar({ ...base, modo: "aplicar" })).toBe(false);
    expect(puedeAplicar(null)).toBe(false);
  });
});

describe("postImportActivos", () => {
  const archivo = new Blob(["xlsx"]);

  it("manda multipart al dealer, sin tenant del cliente ni Content-Type a mano", async () => {
    fetchMock.mockResolvedValue(respuesta(200, REVISION_OK));
    await postImportActivos("dealer a", archivo, "p.xlsx", "revision");
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/v1/autos/dealers/dealer%20a/import-activos?modo=revision");
    expect(path).not.toMatch(/tenant/i);
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("X-Tenant-ID");
    expect(headers).not.toHaveProperty("Content-Type");
    const body = init?.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect((body.get("archivo") as File).name).toBe("p.xlsx");
  });

  it("aplicar lleva la Idempotency-Key", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ...REVISION_OK, modo: "aplicar", aplicado: true }));
    const r = await postImportActivos("d", archivo, "p.xlsx", "aplicar", "k-1");
    expect(importActivosPath("d", "aplicar")).toBe(fetchMock.mock.calls[0][0]);
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>)["Idempotency-Key"]).toBe("k-1");
    expect(r.aplicado).toBe(true);
  });

  it("un 422 con revision es ImportRechazado, con sus filas", async () => {
    fetchMock.mockResolvedValue(
      respuesta(422, { detail: { ...REVISION_OK, errores: [{ hoja: "Vehiculos", fila: 6, mensaje: "m" }] } }),
    );
    const error = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(error).toBeInstanceOf(ImportRechazado);
    expect((error as ImportRechazado).resultado.errores[0].fila).toBe(6);
  });

  it("un aplicar que dice aplicado=false no es un exito", async () => {
    fetchMock.mockResolvedValue(respuesta(200, { ...REVISION_OK, modo: "aplicar", aplicado: false }));
    await expect(postImportActivos("d", archivo, "p.xlsx", "aplicar", "k")).rejects.toBeInstanceOf(ImportRechazado);
  });

  it("403 y 2xx ilegible son errores de acceso con su status", async () => {
    fetchMock.mockResolvedValue(respuesta(403, { detail: { reason_code: "CAPABILITY_DENIED" } }));
    const denegado = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(denegado).toBeInstanceOf(AccessApiError);
    expect((denegado as AccessApiError).status).toBe(403);

    fetchMock.mockResolvedValue(respuesta(200, { ok: true }));
    const ilegible = await postImportActivos("d", archivo, "p.xlsx", "revision").catch((e) => e);
    expect(ilegible).toBeInstanceOf(AccessApiError);
    expect((ilegible as AccessApiError).status).toBe(502);
  });
});
