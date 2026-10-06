/**
 * Importador de la PLANTILLA_ACTIVOS_v4 (D7, contrato P5). El backend LEE el
 * fichero (`services/autos_portal/import_activos/`); aqui no se copia su spec.
 *
 * POST /api/v1/autos/dealers/{dealer_id}/import-activos?aplicar=false|true,
 * multipart con el campo `file`. Respuesta: { ok, vehiculos, costos,
 * incidencias: [{ hoja, fila, codigo, detalle, nivel }], aplicado, creados? }.
 * `nivel` es ERROR o AVISO; `fila` 0 = error del fichero. Un 422 trae la misma
 * forma en `detail`. El tenant sale del token: ni `X-Tenant-ID` ni ruta.
 *
 * `fila` es el numero de fila de Excel tal como lo ve el dealer: el backend
 * enumera desde PRIMERA_FILA_DE_DATOS (5) con las cabeceras contadas, asi que
 * aqui no se le suma nada. `creados` solo viene al aplicar:
 * { vehiculos, costos, adquisiciones }.
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

/** Solo la forma del fichero; version y columnas las dice la REVISION del backend. */
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
  /** `creados` del aplicar; null si la respuesta no lo trae. Un conteo ilegible queda null, nunca 0. */
  creados: ImportCreados | null;
};

export type ImportCreados = {
  vehiculos: number | null;
  costos: number | null;
  adquisiciones: number | null;
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
    creados: creados(rec.creados),
  };
}

function creados(value: unknown): ImportCreados | null {
  const rec = record(value);
  if (!rec) return null;
  const leidos = { vehiculos: count(rec.vehiculos), costos: count(rec.costos), adquisiciones: count(rec.adquisiciones) };
  return Object.values(leidos).every((n) => n === null) ? null : leidos;
}

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

/**
 * "Creados: 2 vehículos, 3 costos y 2 fechas de ingreso al stock." Solo con lo
 * que trae `creados`; un conteo ausente se omite y sin ninguno no hay frase.
 */
export function resumenCreados(c: ImportCreados | null): string | null {
  if (!c) return null;
  const partes = [
    c.vehiculos !== null ? plural(c.vehiculos, "vehículo", "vehículos") : null,
    c.costos !== null ? plural(c.costos, "costo", "costos") : null,
    c.adquisiciones !== null
      ? plural(c.adquisiciones, "fecha de ingreso al stock", "fechas de ingreso al stock")
      : null,
  ].filter((p): p is string => p !== null);
  if (partes.length === 0) return null;
  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
  return `Creados: ${lista}.`;
}

/**
 * Codigo de incidencia del backend (`services/autos_portal/import_activos/importador.py`)
 * -> lo que el dealer lee. El `detalle` del backend (columna y valor) queda en
 * el detalle tecnico plegado, junto al codigo.
 */
export const MENSAJES_INCIDENCIA: Readonly<Record<string, string>> = {
  // Del fichero entero.
  FICHERO_ILEGIBLE: "El archivo no se puede abrir como una planilla .xlsx.",
  VERSION_INCORRECTA: "La planilla no es la versión oficial PLANTILLA_ACTIVOS_v4. Descargá la plantilla de nuevo.",
  HOJA_AUSENTE: "Falta una de las hojas de la plantilla.",
  COLUMNA_OBLIGATORIA_AUSENTE: "A la hoja le faltan columnas obligatorias de la plantilla.",
  // De una fila.
  OBLIGATORIO_VACIO: "Falta completar un dato obligatorio.",
  VALOR_FUERA_DE_LISTA: "Hay un valor que no está entre las opciones de la plantilla.",
  NO_ES_ENTERO: "Hay un dato que tiene que ser un número entero.",
  MONTO_INVALIDO: "El monto no es válido: escribilo sin $ ni separador de miles (por ejemplo 1500000 o 1500000,50).",
  MONTO_NO_POSITIVO: "El monto tiene que ser mayor que cero.",
  FECHA_INVALIDA: "La fecha no es válida: usá el formato DD/MM/AAAA.",
  FECHA_INGRESO_FUTURA: "La fecha de ingreso al stock no puede ser posterior a hoy.",
  PAREJA_INCOMPLETA: "Hay dos datos que van juntos: completá los dos o ninguno.",
  OBLIGATORIO_CONDICIONAL: "Falta un dato que es obligatorio por lo que marcaste en otra columna.",
  REF_REPETIDA: "La referencia del vehículo ya aparece en una fila anterior.",
  STOCK_REPETIDO: "El número de stock ya aparece en una fila anterior.",
  VEHICULO_DESCONOCIDO: "El costo es de un vehículo que no está en la hoja Vehiculos.",
  FALTA_PROVEEDOR_O_FACTURA: "Este tipo de costo necesita proveedor y número de factura.",
  APERTURA_EN_COMPRA_NUEVA: "Un vehículo comprado después de empezar no lleva costos de saldo inicial (es_apertura=SI).",
  COMPRA_DE_STOCK_INICIAL_A_PROVEEDORES:
    "La compra de un vehículo de stock inicial va con es_apertura=SI; con NO quedaría como deuda con proveedores.",
  // Avisos: no bloquean.
  SIN_FECHA_INGRESO: "Sin fecha de ingreso: la antigüedad en stock quedará vacía.",
  FECHA_INGRESO_SIN_MODO: "En una compra nueva la fecha de ingreso no se registra: la antigüedad quedará vacía.",
  ARCHIVAR_NO_DISPONIBLE: "ARCHIVAR todavía no se aplica: esta fila y sus costos no se cargan.",
  SIN_COSTO_DE_COMPRA: "Sin costo de COMPRA en Costos_vehiculos: la venta de este vehículo fallará hasta que tenga ese costo.",
};

/** Para un codigo que este mapa no conoce: no se le inventa significado. */
export const MENSAJE_INCIDENCIA_DESCONOCIDA =
  "La revisión marcó un problema que esta pantalla todavía no sabe explicar. El detalle técnico lo identifica para soporte.";

/**
 * Lo que se lee de una incidencia. Sin codigo (respuesta ilegible) se muestra
 * el mensaje tal cual, como antes; con codigo, el texto en español y el codigo
 * va plegado.
 */
export function mensajeIncidencia(e: Pick<ImportError, "codigo" | "mensaje">): string {
  if (!e.codigo) return e.mensaje;
  return MENSAJES_INCIDENCIA[e.codigo] ?? MENSAJE_INCIDENCIA_DESCONOCIDA;
}

/** "Vehiculos · fila 7": la fila es la de la planilla abierta en Excel. */
export function ubicacionIncidencia(e: Pick<ImportError, "hoja" | "fila">): string {
  return [e.hoja, e.fila !== null ? `fila ${e.fila}` : null].filter(Boolean).join(" · ");
}

/** Errores sin fila: el fichero entero esta mal y ninguna fila cuenta. */
export function erroresDeArchivo(resultado: ImportResultado): ImportError[] {
  return resultado.errores.filter((error) => error.fila === null);
}

export function filasTotales(resultado: ImportResultado): number {
  return resultado.hojas.reduce((total, hoja) => total + hoja.filas, 0);
}

/** Fail-closed: revision con `ok` del backend, sin ningun error y con algo que cargar. */
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
