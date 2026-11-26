export const INVENTORY_UNAVAILABLE = "No pude consultar el inventario en este momento. Intenta de nuevo en unos minutos.";
export const SEED_MESSAGES = [{ role: "bot" as const, text: "¡Hola! ¿Qué vehículo buscas? Puedo ayudarte a consultar el inventario." }];

/** Country comes only from the existing tenant branding locale/currency. */
export function conciergeRegion(branding: { locale?: string | null; currency?: string | null } | null | undefined) {
  const locale = branding?.locale?.trim() || "es";
  const country = /-(AR|DO)$/i.exec(locale)?.[1].toUpperCase() ??
    (branding?.currency?.toUpperCase() === "ARS" ? "AR" : branding?.currency?.toUpperCase() === "DOP" ? "DO" : null);
  return { locale, country, currency: country === "AR" ? "ARS" : country === "DO" ? "DOP" : null };
}

export function regionalReply(text: string, region: ReturnType<typeof conciergeRegion>): string {
  // Never relabel or convert an amount returned in another country's currency.
  if ((region.country !== "DO" && /RD\$|\bDOP\b/i.test(text)) ||
      (region.country !== "AR" && /AR\$|\bARS\b/i.test(text)) ||
      (!region.country && /[$€]|\b(?:USD|EUR)\b/i.test(text))) throw new Error("Moneda incompatible con la región");
  return region.country === "DO" ? text.replace(/RD\$/g, "DOP ") : text.replace(/\b(?:yipeta|jeepeta)s?\b/gi, "SUV");
}
