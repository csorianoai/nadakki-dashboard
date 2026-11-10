"use client";

import { formatoDesdeTenant } from "@/lib/analytics/formato";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { CommandCenterEjecutivo } from "./CommandCenterEjecutivo";
import type { DatosCommandCenter, EstadoPantalla, TemaPantalla } from "./tipos";

/**
 * Envoltorio de cliente de la vista previa: aporta el callback de reintento (una funcion no puede cruzar desde el servidor)
 * y cablea el formato del tenant: locale y moneda salen de la configuracion de cada tenant (useTenantBranding), con es-US / USD
 * por defecto cuando el tenant no los trae o aun no cargo. Nada de esto esta fijo en la pantalla.
 */
export function PantallaDemo({ datos, estado, ahora, tema }: { datos: DatosCommandCenter; estado: EstadoPantalla; ahora: string; tema?: TemaPantalla }) {
  const { data: branding } = useTenantBranding();
  return (
    <CommandCenterEjecutivo
      datos={datos}
      estado={estado}
      ahora={ahora}
      tema={tema}
      formato={formatoDesdeTenant(branding)}
      demo
      onReintentar={() => window.location.assign(window.location.pathname)}
    />
  );
}
