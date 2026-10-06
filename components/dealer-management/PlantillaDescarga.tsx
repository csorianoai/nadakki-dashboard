/**
 * Boton "Descargar plantilla de carga (Excel)": el MISMO en el Centro Operativo
 * y en el importador (P0-3 de la auditoria de Mapaal QA).
 *
 * Antes era texto `emerald-200` sobre `emerald-500/15`: en el tema claro eso da
 * un contraste de 1,11:1 y el enlace se leia como deshabilitado aunque
 * funcionaba. Ahora usa los tokens de ACCION del tema (`--brand` /
 * `--on-brand`), que el shell del dealer redefine para claro y oscuro.
 *
 * Ruta, version, etiqueta y descripcion salen del archivo de datos
 * (`app/centro-operativo/contenido.ts`); aqui no se escribe ninguna. Sin
 * plantilla declarada no se pinta nada: un boton a un fichero inexistente es
 * peor que no tener boton. `download` para que el navegador lo guarde.
 */

import { Download } from "lucide-react";
import type { PlantillaCarga } from "@/app/centro-operativo/contenido";

export function PlantillaDescarga({
  plantilla,
  testId,
}: {
  plantilla: PlantillaCarga | null | undefined;
  testId: string;
}) {
  if (!plantilla) return null;
  return (
    <div className="mt-4">
      <a
        href={plantilla.ruta}
        download
        data-testid={testId}
        data-version={plantilla.version}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-on-brand shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:shadow-nk-ring"
      >
        <Download className="h-4 w-4" aria-hidden />
        {plantilla.etiqueta}
      </a>
      <p className="mt-2 text-xs text-nk-fg-muted">{plantilla.descripcion}</p>
    </div>
  );
}
