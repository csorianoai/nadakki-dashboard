/**
 * Tabla de estados del Inicio del dealer.
 *
 * Regla: el caso se decide por el CODIGO DE ERROR DEL CUERPO, no solo por el
 * status HTTP. Un 422 puede ser moneda funcional sin configurar o un asiento
 * descuadrado, y son mensajes distintos para el dealer.
 */

export type BloqueCaso =
  | "cargando"
  | "vacio"
  | "no_disponible"
  | "falta_configuracion"
  | "fuera_del_plan"
  | "error_validacion"
  | "error";

export type BloqueEstado =
  | { caso: "cargando" }
  | { caso: "vacio"; motivo: string; accion?: { texto: string; href: string } }
  | { caso: "no_disponible"; pedido?: string }
  | { caso: "falta_configuracion" }
  | { caso: "fuera_del_plan" }
  | { caso: "error_validacion"; mensaje: string; codigo: string }
  | { caso: "error" }
  | { caso: "ok" };

export const BLOQUE_TIMEOUT_MS = 15_000;

const CODIGOS_FUERA_DEL_PLAN = new Set([
  "NO_ACTIVE_SUBSCRIPTION",
  "TARGET_CORE_NOT_READY",
]);

/** Codigo estable publicado por el backend contable. */
const CODIGO_MONEDA_FUNCIONAL = "FUNCTIONAL_CURRENCY_NOT_CONFIGURED";

export type RespuestaCruda = {
  status: number;
  codigo?: string | null;
};

function normalizaCodigo(codigo: string | null | undefined): string {
  return (codigo ?? "").trim().toUpperCase();
}

/** Lee el codigo de error del cuerpo, incluyendo detail cuando viene anidado. */
export function codigoDeError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  for (const clave of ["reason_code", "error_code", "code", "codigo"]) {
    const valor = rec[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  const detail = rec.detail;
  if (detail && typeof detail === "object") return codigoDeError(detail);
  if (typeof detail === "string") {
    const prefijo = detail.split(":", 1)[0]?.trim();
    if (prefijo && /^[A-Z][A-Z0-9_]+$/.test(prefijo)) return prefijo;
  }
  return null;
}

export function casoDesdeRespuesta(respuesta: RespuestaCruda): BloqueEstado {
  const { status } = respuesta;
  const codigo = normalizaCodigo(respuesta.codigo);

  if (status === 404 || status === 405) {
    return { caso: "no_disponible" };
  }

  if (CODIGOS_FUERA_DEL_PLAN.has(codigo) || status === 402) {
    return { caso: "fuera_del_plan" };
  }

  if (status === 422 || status === 409) {
    if (codigo === CODIGO_MONEDA_FUNCIONAL) {
      return { caso: "falta_configuracion" };
    }
    return {
      caso: "error_validacion",
      codigo: codigo || "SIN_CODIGO",
      mensaje: mensajeDeValidacion(codigo),
    };
  }

  if (status === 403 && CODIGOS_FUERA_DEL_PLAN.has(codigo)) {
    return { caso: "fuera_del_plan" };
  }

  return { caso: "error" };
}

export function mensajeDeValidacion(codigo: string): string {
  switch (normalizaCodigo(codigo)) {
    case "C1_DESBALANCE":
      return "El asiento no cuadra: el debe y el haber deben sumar lo mismo.";
    case "C10_INMUTABLE":
      return "Este registro ya está cerrado y no se puede modificar.";
    default:
      return "No pudimos guardar los datos: revisa lo introducido.";
  }
}

export const COPY_BLOQUE = {
  no_disponible: "Esta información estará disponible pronto.",
  falta_configuracion:
    "Falta configurar la moneda de tu empresa; contacta a soporte.",
  fuera_del_plan: "No incluido en tu plan.",
  error: "No pudimos cargar esta información",
  reintentar: "Reintentar",
} as const;
