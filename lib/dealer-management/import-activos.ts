/**
 * Importador de la PLANTILLA_ACTIVOS_v4 (D7, contrato P5 de suite#1501).
 *
 * Lo que el dealer sube es el fichero oficial,
 * `docs/autos_portal/plantillas/Plantilla_Activos_Mapaal_v4.xlsx` del backend.
 * Quien lo LEE es el backend: el contrato de columnas, listas y traducciones
 * vive en `services/autos_portal/import_activos/` y aqui NO se copia. Una
 * segunda lectura en el navegador seria una segunda fuente de verdad.
 *
 * Contrato REAL de P5 (`import_activos/router.py` en `main` del backend):
 *
 *   POST /api/v1/autos/dealers/{dealer_id}/import-activos?aplicar=false  (revisar, no escribe)
 *   POST /api/v1/autos/dealers/{dealer_id}/import-activos?aplicar=true   (todo o nada)
 *
 * multipart con el campo `file`. Respuesta:
 *   { ok, vehiculos, costos, incidencias: [{ hoja, fila, codigo, detalle, nivel }],
 *     aplicado, creados?: { vehiculos, costos } }
 * `nivel` es ERROR o AVISO; `fila` 0 = error del fichero. Un 422 trae
 * `detail: { reason_code, error, ...misma revision }`. La version de la
 * plantilla la verifica el backend (VERSION_INCORRECTA es un ERROR).
 *
 * El tenant sale del token. No se manda `X-Tenant-ID` ni el tenant en la ruta.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/** Crea y actualiza vehiculos: la clave 097 del alta. */
export const IMPORT_VEHICLES_CAPABILITY = "autos.inventory.create";
/** Los costos generan asientos: la misma clave que firma dinero en /contable. */
export const IMPORT_COSTS_CAPABILITY = "accounting.ledger.entries";
export const IMPORT_CAPABILITY_KEYS = [IMPORT_VEHICLES_CAPABILITY, IMPORT_COSTS_CAPABILITY];

export type ImportModo = "revision" | "aplicar";

export function importActivosPath(dealerId: string, modo: ImportModo): string {
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/import-activos?aplicar=${modo === "aplicar"}`;
}

/**
 * Solo la forma del fichero: extension y que no este vacio. Si la version o
 * las columnas estan bien lo dice la REVISION del backend, no esta funcion.
 */
export function validarArchivo(file: { name: string; size: number } | null): string | null {
  if (!file) return "Elegí el archivo de la plantilla.";
  if (!/\.(xlsx|zip)$/i.test(file.name.trim())) {
    return "El archivo tiene que ser la plantilla .xlsx o su .zip de CSV.";
  }
  if (file.size <= 0) return "El archivo está vacío.";
  return null;
}

export type ImportHoja = {
  hoja: string;
  filas: number;
};

export type ImportError = {
  hoja: string | null;
  /** null = error del FICHERO (fila 0 del backend), no de una fila. */
  fila: number | null;
  codigo: string | null;
  mensaje: string;
};

export type ImportResultado = {
  modo: ImportModo | null;
  aplicado: boolean;
  /** `ok` del backend: sin ninguna incidencia ERROR. */
  ok: boolean;
  /** Vehiculos y costos leidos (revision) o creados (aplicar). */
  hojas: ImportHoja[];
  /** Conteos ausentes o no enteros: bloquean el aplicar. */
  hojasIlegibles: number;
  errores: ImportError[];
  /** Incidencias nivel AVISO: no bloquean (p. ej. columnas PROXIMAMENTE que no se guardan). */
  avisos: ImportError[];
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function count(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  return null;
}

function incidencia(item: unknown): ImportError {
  const rec = record(item);
  if (!rec) {
    // Numero, null, lista, cadena: ilegible, pero una incidencia no se descarta.
    const mensaje = typeof item === "string" && item.trim() ? item.trim() : "Error ilegible del backend.";
    return { hoja: null, fila: null, codigo: null, mensaje };
  }
  const codigo = text(rec.codigo);
  const fila = count(rec.fila);
  return {
    hoja: text(rec.hoja) === "-" ? null : text(rec.hoja),
    fila: fila === 0 ? null : fila,
    codigo,
    mensaje: text(rec.detalle) ?? codigo ?? "Error sin descripción del backend.",
  };
}

/** Solo `nivel: "AVISO"` es aviso; cualquier otro valor (o ninguno) cuenta como ERROR. */
function esAviso(item: unknown): boolean {
  return record(item)?.nivel === "AVISO";
}

/**
 * Lee la respuesta de los dos modos. Un 422 trae la misma forma dentro de
 * `detail`, y se lee igual: es la revision que dice que no se puede aplicar.
 * `modo` es el que pidio el cliente (la respuesta no lo repite).
 */
export function parseImportResultado(body: unknown, modo: ImportModo | null = null): ImportResultado | null {
  const root = record(body);
  const rec = root && record(root.detail) && !("incidencias" in root) ? record(root.detail) : root;
  if (!rec) return null;
  const incidencias = Array.isArray(rec.incidencias) ? rec.incidencias : [];
  const conteos: Array<[string, number | null]> = [
    ["Vehiculos", count(rec.vehiculos)],
    ["Costos_vehiculos", count(rec.costos)],
  ];
  if (typeof rec.ok !== "boolean" && incidencias.length === 0 && conteos.every(([, n]) => n === null)) return null;
  const hojas: ImportHoja[] = [];
  let hojasIlegibles = 0;
  for (const [hoja, filas] of conteos) {
    // Un conteo ausente no se pinta con un cero inventado, pero tampoco se ignora.
    if (filas === null) hojasIlegibles += 1;
    else hojas.push({ hoja, filas });
  }
  return {
    modo,
    aplicado: rec.aplicado === true,
    ok: rec.ok === true,
    hojas,
    hojasIlegibles,
    errores: incidencias.filter((item) => !esAviso(item)).map(incidencia),
    avisos: incidencias.filter(esAviso).map(incidencia),
  };
}

/** Errores sin fila: el fichero entero esta mal y ninguna fila cuenta. */
export function erroresDeArchivo(resultado: ImportResultado): ImportError[] {
  return resultado.errores.filter((error) => error.fila === null);
}

export function filasTotales(resultado: ImportResultado): number {
  return resultado.hojas.reduce((total, hoja) => total + hoja.filas, 0);
}

/**
 * Fail-closed: solo se ofrece aplicar una revision con `ok` del backend, sin un
 * solo error y con algo que cargar. Una revision a medias no es un permiso
 * para escribir la mitad que paso.
 */
export function puedeAplicar(resultado: ImportResultado | null): boolean {
  if (!resultado || resultado.modo !== "revision" || resultado.aplicado) return false;
  if (!resultado.ok || resultado.errores.length > 0 || resultado.hojasIlegibles > 0) return false;
  return filasTotales(resultado) > 0;
}

export class ImportRechazado extends Error {
  constructor(readonly resultado: ImportResultado) {
    super("IMPORT_RECHAZADO");
  }
}

/**
 * Sube el fichero. Un 422 con revision se devuelve como `ImportRechazado` --el
 * dealer necesita ver sus filas--; cualquier otro fallo, como error de acceso.
 */
export async function postImportActivos(
  dealerId: string,
  file: Blob,
  fileName: string,
  modo: ImportModo,
  idempotencyKey?: string,
): Promise<ImportResultado> {
  const path = importActivosPath(dealerId, modo);
  const form = new FormData();
  form.append("file", file, fileName);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  // Sin Content-Type: el navegador pone el boundary del multipart.
  const response = await apiFetch(path, { method: "POST", headers, body: form });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const resultado = parseImportResultado(body, modo);
  if (response.status === 422 && resultado) throw new ImportRechazado(resultado);
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  if (!resultado) throw accessApiErrorFromHttp(502, { detail: "IMPORT_RESPUESTA_ILEGIBLE" }, path);
  if (modo === "aplicar" && !resultado.aplicado) throw new ImportRechazado(resultado);
  return resultado;
}
