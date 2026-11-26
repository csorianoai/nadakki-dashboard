/**
 * Traduce los rechazos del backend de Investigación a una explicación con lo que hay que hacer.
 *
 * "sin unidad organizativa resoluble" (26-nov-2026): el espacio activo no es un despacho jurídico
 * configurado (p. ej. "Nadakki - Platform Operations" no tiene unidad organizativa), así que la guarda
 * de Legal rechaza toda consulta. No es un fallo de la pregunta: hay que cambiar de despacho.
 */
const SIN_UNIDAD = "sin unidad organizativa resoluble";

export function explicarErrorInvestigacion(mensaje: string, espacio?: string | null): string {
  const m = (mensaje || "").toLowerCase();
  if (m.includes(SIN_UNIDAD)) {
    const donde = espacio ? `«${espacio}»` : "El espacio activo";
    return (
      `${donde} no está configurado como despacho jurídico, por eso no puede hacer consultas legales. ` +
      "Cambia de despacho en el selector **Tenant** de la barra superior (por ejemplo, tu despacho o " +
      "«QA Legal Audit») y vuelve a enviar la pregunta: queda guardada en la caja de abajo."
    );
  }
  if (m.includes("plan_no_incluye") || m.includes("capability_not_in_plan")) {
    return "El plan de este despacho no incluye este agente. Elige otro agente arriba o amplía el plan.";
  }
  return mensaje;
}
