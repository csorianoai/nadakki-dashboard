import type { LocaleTenant } from "@/lib/dcc/formato";

/**
 * Porcentaje del banco v2 con el formato del tenant y SIEMPRE con espacio
 * duro antes de "%": "0 %", "12.5 %" en es-DO, "12,5 %" en es. Intl pega el
 * signo en algunos locales (es-DO da "0%") y en otros no; el banco veia ambos
 * en la misma pantalla. Los digitos y separadores salen del locale; solo se
 * normaliza la union con el signo. Recibe la proporcion que dio el backend
 * (0..1): el frontend no divide para obtenerla.
 */
export function porcentaje(proporcion: unknown, tenant: LocaleTenant): string | null {
  if (typeof proporcion !== "number" || !Number.isFinite(proporcion)) return null;
  const partes = new Intl.NumberFormat(tenant.locale, { style: "percent", maximumFractionDigits: 1 }).formatToParts(proporcion);
  const numero = partes
    .filter((p) => p.type !== "percentSign" && !(p.type === "literal" && !p.value.trim()))
    .map((p) => p.value)
    .join("");
  return `${numero} %`;
}

/** Un valor que ya viene en puntos porcentuales (p. ej. tasa de interes 12.5): mismo formato. */
export function puntosPorcentuales(valor: unknown, tenant: LocaleTenant, decimales = 2): string | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return `${new Intl.NumberFormat(tenant.locale, { maximumFractionDigits: decimales }).format(valor)} %`;
}
