"use client";

/**
 * Precio publico de /autos: la moneda y el locale salen del branding PUBLICO del
 * tenant (nunca "RD$" escrito a mano ni una conversion a US$ con tipo fijo).
 * Sin moneda configurada o sin precio real, se dice "Precio a consultar".
 */

import { useCallback } from "react";
import { getTenantId } from "@/lib/autos-consumer-api";
import { localeDeTenant, type LocaleTenant } from "@/lib/dealer-management/formato";
import { usePublicTenantBrandingBySlug } from "@/lib/hooks/usePublicTenantBrandingBySlug";

export const SIN_PRECIO = "Precio a consultar";

export function formatPrecioPublico(valor: number | null | undefined, locale: LocaleTenant): string {
  if (valor == null || !Number.isFinite(valor) || valor <= 0 || !locale.currency) return SIN_PRECIO;
  return new Intl.NumberFormat(locale.locale, {
    style: "currency",
    currency: locale.currency,
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Formateador de importes con la moneda del tenant. */
export function useFmtPrecio(): (valor: number | null | undefined) => string {
  const branding = usePublicTenantBrandingBySlug(getTenantId());
  const locale = localeDeTenant(branding.data);
  const { locale: loc, currency } = locale;
  return useCallback(
    (valor) => formatPrecioPublico(valor, { locale: loc, currency }),
    [loc, currency],
  );
}
