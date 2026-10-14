/**
 * Marco regulatorio del tenant para Cumplimiento (bank-v2), desde el
 * `regulatory_profile` del branding (p. ej. "DO_LEY_172_13", "INDOTEL",
 * "MX_CNBV"). Mismos marcos que el panel actual (complianceHeroTitle), pero
 * sin suponer Republica Dominicana: un perfil desconocido o ausente no pinta
 * nada.
 */
export type MarcoRegulatorio = { codigo: "DO" | "MX" | "CO"; titulo: string; descripcion: string };

const MARCOS: Array<[RegExp, MarcoRegulatorio]> = [
  [
    /172[-_ ]?13|^DO(_|$)|INDOTEL/i,
    {
      codigo: "DO",
      titulo: "Ley 172-13 (República Dominicana)",
      descripcion: "Protección de datos personales: consentimientos, documentación mínima y trazabilidad de las decisiones de crédito.",
    },
  ],
  [/CNBV|^MX(_|$)/i, { codigo: "MX", titulo: "CNBV (México)", descripcion: "Identificación del cliente, prevención de lavado de dinero y conservación de expedientes crediticios." }],
  [/SFC|^CO(_|$)/i, { codigo: "CO", titulo: "SFC (Colombia)", descripcion: "Protección del consumidor financiero y de sus datos personales." }],
];

export function marcoRegulatorio(perfil: string | null | undefined): MarcoRegulatorio | null {
  const p = perfil?.trim();
  if (!p) return null;
  return MARCOS.find(([re]) => re.test(p))?.[1] ?? null;
}
