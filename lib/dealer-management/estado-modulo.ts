/**
 * Vocabulario UNICO de estado de modulo para el panel del dealer.
 *
 * Tres estados, y solo tres:
 *   activo            -> el dealer puede operarlo ahora.
 *   segun_onboarding  -> contratado pero todavia no habilitado.
 *   oculto            -> no se muestra (no contratado, o sin decision).
 *
 * El texto de "segun_onboarding" esta fijado por producto y NO se cambia:
 * "Se habilita según avance de tu onboarding."
 * Nunca "En preparación" ni "en reparación" ni "Bloqueado": el dealer no tiene
 * por que leer que algo esta roto, ni jerga del backend (DEFAULT_DENY,
 * readiness, is_usable, reason_code).
 */

export type EstadoModulo = "activo" | "segun_onboarding" | "fuera_del_plan" | "oculto";

export const COPY_ESTADO_MODULO: Record<
  Exclude<EstadoModulo, "oculto">,
  { etiqueta: string; detalle: string }
> = {
  activo: {
    etiqueta: "Activo",
    detalle: "Puedes usarlo ahora.",
  },
  segun_onboarding: {
    etiqueta: "Según avance del onboarding",
    detalle: "Se habilita según avance de tu onboarding.",
  },
  fuera_del_plan: {
    etiqueta: "No incluido en tu plan",
    detalle: "Habla con tu administrador para añadirlo.",
  },
};

/** Mientras se comprueba el acceso: sin cifras, sin jerga, sin promesas. */
export const COPY_COMPROBANDO = "Comprobando tu acceso…";

/** Codigos que significan "no esta en el plan contratado". */
const FUERA_DEL_PLAN = new Set(["UPGRADE_REQUIRED", "NO_ACTIVE_SUBSCRIPTION"]);

export type DecisionModulo = {
  allowed?: boolean;
  reason_code?: string | null;
};

/**
 * Traduce la decision del backend al estado que ve el dealer.
 *
 * Sin decision -> "segun_onboarding": para Mapaal, que esta en pleno
 * onboarding, es lo cierto y lo util. La autoridad no cambia: el modulo sigue
 * sin poder abrirse; esto solo decide como se nombra.
 */
export function estadoDeModulo(
  decision: DecisionModulo | undefined,
  opciones: { comprobando?: boolean } = {},
): EstadoModulo {
  if (opciones.comprobando) return "oculto";
  if (decision?.allowed === true) return "activo";

  const codigo = (decision?.reason_code ?? "").trim().toUpperCase();
  if (FUERA_DEL_PLAN.has(codigo)) return "fuera_del_plan";

  return "segun_onboarding";
}

/** Etiqueta corta para la insignia de la tarjeta. */
export function etiquetaEstado(estado: EstadoModulo, comprobando = false): string {
  if (comprobando) return COPY_COMPROBANDO;
  if (estado === "oculto") return "";
  return COPY_ESTADO_MODULO[estado].etiqueta;
}
