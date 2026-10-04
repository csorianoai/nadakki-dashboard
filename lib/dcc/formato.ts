/**
 * Formato del DCC con el locale y la moneda DEL TENANT (`localeDeTenant`). No
 * calcula: escribe el numero que dio el backend. Sin moneda configurada devuelve
 * null y la tarjeta queda "aun no disponible". Mapaal ve "$ 182,4 M": el espacio
 * entre simbolo y numero sale del patron no compacto del propio locale.
 */

import { localeDeTenant, type LocaleTenant } from "@/lib/dealer-management/formato";

export { localeDeTenant, type LocaleTenant };

function finito(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

/** Literal que el locale pone entre el simbolo de moneda y el numero, o "". */
function separadorMoneda(locale: string, currency: string): string {
  const partes = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(1);
  const i = partes.findIndex((p) => p.type === "currency");
  if (i < 0) return "";
  const antes = partes[i - 1];
  const despues = partes[i + 1];
  if (despues?.type === "literal") return despues.value;
  if (antes?.type === "literal") return antes.value;
  return "";
}

/** "$ 182.400.000,00" — importe completo. null si no hay moneda o valor. */
export function formatMoneda(valor: unknown, tenant: LocaleTenant): string | null {
  if (!finito(valor) || !tenant.currency) return null;
  return new Intl.NumberFormat(tenant.locale, { style: "currency", currency: tenant.currency }).format(valor);
}

/** "$ 182,4 M" — importe compacto para KPIs. null si no hay moneda o valor. */
export function formatMonedaCompacta(valor: unknown, tenant: LocaleTenant): string | null {
  if (!finito(valor) || !tenant.currency) return null;
  const { locale, currency } = tenant;
  const partes = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).formatToParts(valor);
  const sep = separadorMoneda(locale, currency);
  let salida = "";
  partes.forEach((parte, i) => {
    salida += parte.value;
    const siguiente = partes[i + 1];
    if (!sep || !siguiente) return;
    const pegados =
      (parte.type === "currency" && siguiente.type !== "literal") ||
      (siguiente.type === "currency" && parte.type !== "literal");
    if (pegados) salida += sep;
  });
  return salida;
}

/** "1.234" — enteros (unidades, leads, solicitudes). */
export function formatEntero(valor: unknown, tenant: LocaleTenant): string | null {
  if (!finito(valor)) return null;
  return new Intl.NumberFormat(tenant.locale, { maximumFractionDigits: 0 }).format(valor);
}

/**
 * "12,5 %" — SOLO para una proporcion que ya calculo el backend (0..1).
 * El frontend no divide para obtenerla.
 */
export function formatPorcentaje(proporcion: unknown, tenant: LocaleTenant): string | null {
  if (!finito(proporcion)) return null;
  return new Intl.NumberFormat(tenant.locale, { style: "percent", maximumFractionDigits: 1 }).format(proporcion);
}

function fecha(valor: unknown): Date | null {
  if (typeof valor !== "string" && !(valor instanceof Date)) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "4 oct 2026" en el locale del tenant. */
export function formatFecha(valor: unknown, tenant: LocaleTenant): string | null {
  const d = fecha(valor);
  if (!d) return null;
  return new Intl.DateTimeFormat(tenant.locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}
