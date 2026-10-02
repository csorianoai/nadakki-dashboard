/**
 * Reason codes con los que el motor de acceso dice "no pude evaluarte", que no es
 * lo mismo que "no tienes derecho".
 *
 * Medido sobre `origin/main` del backend:
 *
 *   services/access/entitlements.py:65-66   NO_BENEFICIARY_ENTITLEMENT =
 *                                           "no_beneficiary_entitlement"
 *                                           NO_ORGANIZATION_UNIT =
 *                                           "no_organization_unit"
 *   services/access/entitlements.py:330-339 sin `organization_unit_id`, la cadena
 *                                           BENEFICIARY deniega CERRADO antes de
 *                                           consultar nada
 *
 * Dos detalles que deciden la forma de este modulo:
 *
 *  1. Los codigos llegan EN MINUSCULAS, y `types/entitlements.ts:16` los declara
 *     en MAYUSCULAS. Comparar contra la forma declarada no reconoce lo que el
 *     backend manda --`components/dealer/CoreNavigation.tsx:200` tiene
 *     exactamente ese problema-- asi que aqui se compara sin distinguir caja.
 *  2. No son un error HTTP: viajan dentro de un 200, como items denegados del
 *     batch. Quien los busque en un `catch` no los va a encontrar.
 *
 * Vive en la capa de acceso y no en el chrome de un portal porque lo consumen dos
 * menus distintos: la barra "Suite operativa" y el menu del dealer.
 */

export const ACCESS_UNVERIFIABLE_REASONS = new Set([
  "no_organization_unit",
  "no_beneficiary_entitlement",
]);

/** La frase, tal cual la pide producto. */
export const ACCESS_UNVERIFIED_MESSAGE = "No se pudieron verificar tus accesos";

export const ACCESS_UNVERIFIED_DETAIL =
  "El menú está vacío porque no se pudo comprobar tu acceso, no porque no tengas módulos. Reintentá o avisá a soporte.";

export function isAccessUnverified(reasonCode: string | null | undefined): boolean {
  const valor = reasonCode?.trim().toLowerCase() ?? "";
  return valor.length > 0 && ACCESS_UNVERIFIABLE_REASONS.has(valor);
}

/**
 * Primer reason code de un batch que indique verificacion fallida.
 *
 * Se recorren los items porque la denegacion es POR CAPABILITY: el motor puede
 * resolver unas y no otras, y basta una para saber que la unidad no llego.
 */
export function unverifiedReasonFromBatch(
  results: Record<string, { reason_code?: string | null } | undefined> | null | undefined,
): string | null {
  if (!results) return null;
  for (const item of Object.values(results)) {
    const codigo = item?.reason_code;
    if (isAccessUnverified(codigo)) return (codigo as string).trim();
  }
  return null;
}
