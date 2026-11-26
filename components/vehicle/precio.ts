"use client";

/**
 * Precio publico de UN vehiculo: la moneda sale del propio vehiculo (price_currency del backend, mapeada a
 * `vehicle.currency`). Solo si el vehiculo no la trae se usa la del branding del tenant (useFmtPrecio).
 *
 * Por que (26-nov, QA de Mapaal): el visitante anonimo del portal no tiene tenant en localStorage, asi que
 * useFmtPrecio pide el branding de "demo-tenant" (401) y se queda sin moneda: toda la vitrina decia
 * "Precio a consultar" aunque la RAV4 publicada trae 14.000.000 ARS.
 */
import { useCallback } from "react";
import { useFmtPrecio } from "@/lib/autos-portal/moneda-publica";
import type { Vehicle } from "@/lib/vehicles";

export const PRECIO_A_CONSULTAR = "Precio a consultar";

/** Locale de presentacion por moneda; sin moneda conocida, "es". */
const LOCALE_POR_MONEDA: Record<string, string> = {
  ARS: "es-AR",
  DOP: "es-DO",
  MXN: "es-MX",
  CLP: "es-CL",
  COP: "es-CO",
  UYU: "es-UY",
  USD: "en-US",
};

function monedaValida(moneda: string | null | undefined): string | null {
  const m = (moneda ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(m) ? m : null;
}

/** Importe con la moneda del vehiculo; null si no hay moneda valida (el llamador decide el fallback). */
export function formatPrecioEnMoneda(valor: number | null | undefined, moneda: string | null | undefined): string | null {
  const m = monedaValida(moneda);
  if (!m) return null;
  if (valor == null || !Number.isFinite(valor) || valor <= 0) return PRECIO_A_CONSULTAR;
  try {
    return new Intl.NumberFormat(LOCALE_POR_MONEDA[m] ?? "es", {
      style: "currency",
      currency: m,
      maximumFractionDigits: 0,
    }).format(valor);
  } catch {
    return null;
  }
}

/** Formateador de importes de este vehiculo: su moneda primero, la del tenant despues. */
export function useFmtPrecioDe(vehicle: Pick<Vehicle, "currency"> | null | undefined) {
  const fmtTenant = useFmtPrecio();
  const moneda = vehicle?.currency;
  return useCallback(
    (valor: number | null | undefined) => formatPrecioEnMoneda(valor, moneda) ?? fmtTenant(valor),
    [moneda, fmtTenant],
  );
}
