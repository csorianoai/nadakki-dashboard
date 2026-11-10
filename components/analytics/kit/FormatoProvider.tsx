"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { FORMATO_POR_DEFECTO, normalizarFormato, type FormatoTenant } from "@/lib/analytics/formato";

const FormatoContext = createContext<FormatoTenant>(FORMATO_POR_DEFECTO);

export interface FormatoProviderProps {
  /** Formato del tenant (ver formatoDesdeTenant). Lo invalido o ausente cae a es-US / USD. */
  formato?: Partial<FormatoTenant> | null;
  children: ReactNode;
}

/**
 * Locale y moneda del tenant para todo el kit. La pantalla lo monta una vez con
 * `<FormatoProvider formato={formatoDesdeTenant(branding)}>`; sin proveedor, los componentes usan es-US / USD.
 */
export function FormatoProvider({ formato, children }: FormatoProviderProps) {
  const valor = useMemo(() => normalizarFormato(formato), [formato?.locale, formato?.moneda]); // eslint-disable-line react-hooks/exhaustive-deps
  return <FormatoContext.Provider value={valor}>{children}</FormatoContext.Provider>;
}

/** Formato del tenant vigente (nunca undefined). */
export function useFormato(): FormatoTenant {
  return useContext(FormatoContext);
}
