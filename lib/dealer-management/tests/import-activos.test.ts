/** Contrato D7 con la forma REAL de P5: no ofrecer aplicar con errores, tenant fuera del cliente, 422 leído como revisión. */
import {
  IMPORT_CAPABILITY_KEYS,
  ImportRechazado,
  erroresDeArchivo,
  filasTotales,
  MENSAJES_INCIDENCIA,
  MENSAJE_INCIDENCIA_DESCONOCIDA,
  importActivosPath,
  mensajeIncidencia,
  parseImportResultado,
  resumenCreados,
  ubicacionIncidencia,
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

describe("mensajes en español de las incidencias", () => {
  it("MONTO_INVALIDO y FECHA_INGRESO_FUTURA tienen su texto, sin el codigo crudo", () => {
    const monto = mensajeIncidencia({ codigo: "MONTO_INVALIDO", mensaje: "monto: '1.500' no es un monto" });
    expect(monto).toMatch(/^El monto no es válido/);
    expect(mensajeIncidencia({ codigo: "FECHA_INGRESO_FUTURA", mensaje: "x" })).toBe(
      "La fecha de ingreso al stock no puede ser posterior a hoy.",
    );
    const codigos = Object.keys(MENSAJES_INCIDENCIA);
    for (const texto of Object.values(MENSAJES_INCIDENCIA)) for (const c of codigos) expect(texto).not.toContain(c);
  });

  it("cubre todos los codigos que emite el importador del backend", () => {
    const delBackend = [
      "FICHERO_ILEGIBLE", "VERSION_INCORRECTA", "HOJA_AUSENTE", "COLUMNA_OBLIGATORIA_AUSENTE",
      "OBLIGATORIO_VACIO", "VALOR_FUERA_DE_LISTA", "NO_ES_ENTERO", "MONTO_INVALIDO", "MONTO_NO_POSITIVO",
      "FECHA_INVALIDA", "FECHA_INGRESO_FUTURA", "PAREJA_INCOMPLETA", "OBLIGATORIO_CONDICIONAL",
      "REF_REPETIDA", "STOCK_REPETIDO", "VEHICULO_DESCONOCIDO", "FALTA_PROVEEDOR_O_FACTURA",
      "APERTURA_EN_COMPRA_NUEVA", "COMPRA_DE_STOCK_INICIAL_A_PROVEEDORES",
      "SIN_FECHA_INGRESO", "FECHA_INGRESO_SIN_MODO", "ARCHIVAR_NO_DISPONIBLE", "SIN_COSTO_DE_COMPRA",
    ];
    expect(Object.keys(MENSAJES_INCIDENCIA).sort()).toEqual([...delBackend].sort());
  });

  it("'fallará' va con tilde", () => {
    expect(MENSAJES_INCIDENCIA.SIN_COSTO_DE_COMPRA).toContain("fallará");
    expect(Object.values(MENSAJES_INCIDENCIA).join(" ")).not.toMatch(/fallara\b/);
  });

  it("un codigo desconocido da el mensaje generico, no uno inventado", () => {
    expect(mensajeIncidencia({ codigo: "OTRA_COSA", mensaje: "detalle del backend" })).toBe(MENSAJE_INCIDENCIA_DESCONOCIDA);
  });

  it("sin codigo (respuesta ilegible) se muestra el mensaje tal cual", () => {
    expect(mensajeIncidencia({ codigo: null, mensaje: "Error ilegible del backend." })).toBe("Error ilegible del backend.");
  });
});

describe("la fila es la de la planilla", () => {
  it("se muestra el numero del backend sin sumarle la cabecera (ya la cuenta)", () => {
    const r = parseImportResultado({ ...REVISION_OK, ok: false, incidencias: [ERROR_FILA] }, "revision")!;
    expect(ubicacionIncidencia(r.errores[0])).toBe("Costos_vehiculos · fila 5");
  });

  it("un aviso tambien dice su fila; un error de fichero, solo la hoja o nada", () => {
    const r = parseImportResultado(REVISION_OK, "revision")!;
    expect(ubicacionIncidencia(r.avisos[0])).toBe("Vehiculos · fila 4");
    expect(ubicacionIncidencia({ hoja: "Vehiculos", fila: null })).toBe("Vehiculos");
    expect(ubicacionIncidencia({ hoja: null, fila: null })).toBe("");
  });
});

describe("resumen de lo creado al aplicar", () => {
  it("lee `creados` de la respuesta real", () => {
    const r = parseImportResultado(
      { ...REVISION_OK, aplicado: true, creados: { vehiculos: 2, costos: 3, adquisiciones: 2 } },
      "aplicar",
    )!;
    expect(r.creados).toEqual({ vehiculos: 2, costos: 3, adquisiciones: 2 });
    expect(resumenCreados(r.creados)).toBe("Creados: 2 vehículos, 3 costos y 2 fechas de ingreso al stock.");
  });

  it("singular y conteos parciales: lo ausente se omite, nunca se pinta 0", () => {
    expect(resumenCreados({ vehiculos: 1, costos: null, adquisiciones: null })).toBe("Creados: 1 vehículo.");
    expect(resumenCreados({ vehiculos: 1, costos: 1, adquisiciones: null })).toBe("Creados: 1 vehículo y 1 costo.");
    const r = parseImportResultado({ ...REVISION_OK, aplicado: true, creados: { vehiculos: 2, costos: "x" } }, "aplicar")!;
    expect(r.creados).toEqual({ vehiculos: 2, costos: null, adquisiciones: null });
  });

  it("sin `creados` (revision, o respuesta sin el campo) no hay resumen", () => {
    expect(parseImportResultado(REVISION_OK, "revision")!.creados).toBeNull();
    expect(parseImportResultado({ ...REVISION_OK, creados: {} }, "aplicar")!.creados).toBeNull();
    expect(resumenCreados(null)).toBeNull();
  });
});
