/**
 * Tabla de casos de _contexto/AVISOS_Y_PEDIDOS_BACKEND.md, seccion 1.
 *
 * Regla que manda: el caso se decide por el CODIGO DE ERROR DEL CUERPO, no solo
 * por el status HTTP. Un 422 puede ser moneda funcional sin configurar o un
 * asiento descuadrado, y son mensajes distintos para el dealer.
 *
 * Los siete casos nunca se mezclan ni comparten mensaje.
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

/** Timeout por defecto de la tabla 1: pasado esto, "Error" con reintento. */
export const BLOQUE_TIMEOUT_MS = 15_000;

/**
 * Codigos que significan "el modulo no esta en el plan".
 * 402 NO_ACTIVE_SUBSCRIPTION / 403 TARGET_CORE_NOT_READY.
 */
const CODIGOS_FUERA_DEL_PLAN = new Set(["NO_ACTIVE_SUBSCRIPTION", "TARGET_CORE_NOT_READY"]);

/**
 * Moneda funcional sin configurar (aviso 2.1). El backend AUN NO expone el
 * nombre exacto del codigo: llega con #1475 y la cola contable. Hasta tenerlo,
 * NO se asume que todo 422 sea moneda faltante; solo estos candidatos, y
 * cualquier otro 422 cae en "Error de validacion" con su propio codigo.
 *
 * Cuando el backend confirme el nombre real, se anade aqui y se borra este
 * comentario. Mapaal ya tiene moneda (ARS): no deberia verlo.
 */
const CODIGOS_MONEDA_FUNCIONAL = new Set([
  "MONEDA_FUNCIONAL_NO_CONFIGURADA",
  "FUNCTIONAL_CURRENCY_NOT_CONFIGURED",
  "MISSING_FUNCTIONAL_CURRENCY",
]);

export type RespuestaCruda = {
  status: number;
  /** Codigo de error leido del cuerpo, no del status. */
  codigo?: string | null;
};

function normalizaCodigo(codigo: string | null | undefined): string {
  return (codigo ?? "").trim().toUpperCase();
}

/** Lee el codigo de error del cuerpo, probando las claves que usa el backend. */
export function codigoDeError(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const rec = body as Record<string, unknown>;
  for (const clave of ["reason_code", "error_code", "code", "codigo"]) {
    const valor = rec[clave];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  const detail = rec.detail;
  if (detail && typeof detail === "object") return codigoDeError(detail);
  return null;
}

/**
 * Traduce una respuesta de error al caso que ve el dealer.
 * `rutaSinLector` marca endpoints que no existen (404, o 405 en ruta sin GET).
 */
export function casoDesdeRespuesta(respuesta: RespuestaCruda): BloqueEstado {
  const { status } = respuesta;
  const codigo = normalizaCodigo(respuesta.codigo);

  // "No disponible aun": el endpoint no existe, o existe sin lector GET.
  if (status === 404 || status === 405) {
    return { caso: "no_disponible" };
  }

  if (CODIGOS_FUERA_DEL_PLAN.has(codigo) || status === 402) {
    return { caso: "fuera_del_plan" };
  }

  if (status === 422 || status === 409) {
    if (CODIGOS_MONEDA_FUNCIONAL.has(codigo)) {
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

/** Codigos de negocio conocidos, en lenguaje del dealer. */
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
