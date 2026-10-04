/**
 * Importador de la PLANTILLA_ACTIVOS_v4 (D7, contrato P5 de suite#1501).
 *
 * Lo que el dealer sube es el fichero oficial,
 * `docs/autos_portal/plantillas/Plantilla_Activos_Mapaal_v4.xlsx` del backend
 * (o su `_CSV.zip`). Quien lo LEE es el backend: el contrato de columnas,
 * listas y traducciones vive en
 * `services/autos_portal/import_activos/plantilla_spec.py` y aqui NO se copia.
 * Una segunda lectura en el navegador seria una segunda fuente de verdad que
 * se desalinea sola.
 *
 * Dos pasos, como dice la spec ("se informa en la REVISION"):
 *
 *   POST /api/v1/autos/dealers/{dealer_id}/import-activos?modo=revision
 *   POST /api/v1/autos/dealers/{dealer_id}/import-activos?modo=aplicar
 *
 * multipart con el campo `archivo`. La revision no escribe nada; aplicar
 * escribe y es idempotente por `stock_number` (CLAVE_DE_IDEMPOTENCIA de la
 * spec) y por la `Idempotency-Key` que manda la pantalla.
 *
 * El tenant sale del token. No se manda `X-Tenant-ID` ni el tenant en la ruta:
 * un tenant que viaja desde el cliente es un tenant que el cliente elige.
 *
 * Las rutas de arriba son la forma que este frontend PROPONE a P5: medido el
 * 2026-10-04, `services/autos_portal/import_activos/` en `main` del backend
 * solo tiene la spec y ninguna ruta HTTP. Estan declaradas UNA vez, en
 * `importActivosPath`, para que alinearlas con P5 sea una linea.
 */

import { accessApiErrorFromHttp } from "@/lib/access/client";
import { apiFetch } from "@/lib/api/fetch-client";

/** Crea y actualiza vehiculos: la clave 097 del alta. */
export const IMPORT_VEHICLES_CAPABILITY = "autos.inventory.create";
/** Los costos generan asientos: la misma clave que firma dinero en /contable. */
export const IMPORT_COSTS_CAPABILITY = "accounting.ledger.entries";
export const IMPORT_CAPABILITY_KEYS = [IMPORT_VEHICLES_CAPABILITY, IMPORT_COSTS_CAPABILITY];

/** LEEME!B3. El backend la verifica; aqui se usa para no ofrecer aplicar otra. */
export const PLANTILLA_VERSION = "PLANTILLA_ACTIVOS_v4";

export const IMPORT_ACCEPT =
  ".xlsx,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip";

export type ImportModo = "revision" | "aplicar";

export function importActivosPath(dealerId: string, modo: ImportModo): string {
  return `/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/import-activos?modo=${modo}`;
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
  crear: number | null;
  actualizar: number | null;
  archivar: number | null;
  /** Costos con es_apertura=SI: haber 3020 Saldos iniciales. */
  apertura: number | null;
  /** Costos con es_apertura=NO: haber 2010 Proveedores. */
  operacion: number | null;
};

export type ImportError = {
  hoja: string | null;
  /** null = error del FICHERO (version, columna obligatoria), no de una fila. */
  fila: number | null;
  columna: string | null;
  codigo: string | null;
  mensaje: string;
};

export type ImportNoAplicado = { hoja: string; columna: string | null; motivo: string | null };

export type ImportResultado = {
  modo: ImportModo | null;
  version: string | null;
  aplicado: boolean;
  hojas: ImportHoja[];
  /** Hojas que llegaron sin nombre o sin conteo entero: bloquean el aplicar. */
  hojasIlegibles: number;
  errores: ImportError[];
  /** PROXIMAMENTE y hojas bloqueadas: se aceptan y NO se guardan. */
  noAplicado: ImportNoAplicado[];
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
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hojas(value: unknown): { hojas: ImportHoja[]; ilegibles: number } {
  const out: ImportHoja[] = [];
  let ilegibles = 0;
  for (const item of list(value)) {
    const rec = record(item);
    const hoja = rec ? text(rec.hoja) : null;
    const filas = rec ? count(rec.filas) : null;
    // Una hoja sin nombre o sin conteo no se pinta con un cero inventado,
    // pero tampoco se ignora: se cuenta y puedeAplicar() queda cerrado.
    if (!rec || !hoja || filas === null) {
      ilegibles += 1;
      continue;
    }
    out.push({
      hoja,
      filas,
      crear: count(rec.crear),
      actualizar: count(rec.actualizar),
      archivar: count(rec.archivar),
      apertura: count(rec.apertura),
      operacion: count(rec.operacion),
    });
  }
  return { hojas: out, ilegibles };
}

function errores(value: unknown): ImportError[] {
  const out: ImportError[] = [];
  for (const item of list(value)) {
    const rec = record(item);
    if (typeof item === "string" && item.trim()) {
      out.push({ hoja: null, fila: null, columna: null, codigo: null, mensaje: item.trim() });
      continue;
    }
    if (!rec) {
      // Numero, null, lista, cadena vacia: ilegible, pero un error no se descarta.
      out.push({ hoja: null, fila: null, columna: null, codigo: null, mensaje: "Error ilegible del backend." });
      continue;
    }
    const codigo = text(rec.codigo) ?? text(rec.code);
    const mensaje = text(rec.mensaje) ?? text(rec.message) ?? codigo;
    // Sin mensaje ni codigo no hay nada que decirle al dealer, pero tampoco se
    // descarta: un error mudo sigue bloqueando el aplicar.
    out.push({
      hoja: text(rec.hoja),
      fila: count(rec.fila),
      columna: text(rec.columna),
      codigo,
      mensaje: mensaje ?? "Error sin descripción del backend.",
    });
  }
  return out;
}

function noAplicado(value: unknown): ImportNoAplicado[] {
  const out: ImportNoAplicado[] = [];
  for (const item of list(value)) {
    const rec = record(item);
    const hoja = rec ? text(rec.hoja) : null;
    if (!rec || !hoja) continue;
    out.push({ hoja, columna: text(rec.columna), motivo: text(rec.motivo) });
  }
  return out;
}

/**
 * Lee la respuesta de los dos modos. Un 422 trae la misma forma dentro de
 * `detail`, y se lee igual: es la revision que dice que no se puede aplicar.
 */
export function parseImportResultado(body: unknown): ImportResultado | null {
  const root = record(body);
  const rec = root && record(root.detail) && !("hojas" in root) ? record(root.detail) : root;
  if (!rec) return null;
  const leidas = hojas(rec.hojas);
  const modo = rec.modo === "revision" || rec.modo === "aplicar" ? rec.modo : null;
  const resultado: ImportResultado = {
    modo,
    version: text(rec.version),
    aplicado: rec.aplicado === true,
    hojas: leidas.hojas,
    hojasIlegibles: leidas.ilegibles,
    errores: errores(rec.errores),
    noAplicado: noAplicado(rec.no_aplicado ?? rec.proximamente),
  };
  if (
    !resultado.version &&
    resultado.hojas.length === 0 &&
    resultado.hojasIlegibles === 0 &&
    resultado.errores.length === 0
  ) {
    return null;
  }
  return resultado;
}

/** Errores sin fila: el fichero entero esta mal y ninguna fila cuenta. */
export function erroresDeArchivo(resultado: ImportResultado): ImportError[] {
  return resultado.errores.filter((error) => error.fila === null);
}

export function filasTotales(resultado: ImportResultado): number {
  return resultado.hojas.reduce((total, hoja) => total + hoja.filas, 0);
}

/**
 * Fail-closed: solo se ofrece aplicar una revision de ESTA version, sin un
 * solo error y con algo que cargar. Una revision a medias no es un permiso
 * para escribir la mitad que paso.
 */
export function puedeAplicar(resultado: ImportResultado | null): boolean {
  if (!resultado || resultado.modo !== "revision") return false;
  if (resultado.version !== PLANTILLA_VERSION) return false;
  if (resultado.errores.length > 0 || resultado.hojasIlegibles > 0) return false;
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
  form.append("archivo", file, fileName);
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
  const resultado = parseImportResultado(body);
  if (response.status === 422 && resultado) throw new ImportRechazado(resultado);
  if (!response.ok) throw accessApiErrorFromHttp(response.status, body, path);
  if (!resultado) throw accessApiErrorFromHttp(502, { detail: "IMPORT_RESPUESTA_ILEGIBLE" }, path);
  if (modo === "aplicar" && !resultado.aplicado) throw new ImportRechazado(resultado);
  return resultado;
}
