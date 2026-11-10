"use client";

import { CommandCenterEjecutivo } from "./CommandCenterEjecutivo";
import type { DatosCommandCenter, EstadoPantalla } from "./tipos";

/** Envoltorio de cliente de la vista previa: aporta el callback de reintento (una funcion no puede cruzar desde el servidor). */
export function PantallaDemo({ datos, estado, ahora }: { datos: DatosCommandCenter; estado: EstadoPantalla; ahora: string }) {
  return (
    <CommandCenterEjecutivo
      datos={datos}
      estado={estado}
      ahora={ahora}
      demo
      onReintentar={() => window.location.assign(window.location.pathname)}
    />
  );
}
