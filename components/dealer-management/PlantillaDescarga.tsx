"use client";

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
 * peor que no tener boton.
 *
 * Se DESCARGA con su nombre (auditoria Mapaal QA): el `download` vacio no
 * bastaba y el .xlsx se abria en el navegador. Ahora `download` lleva el nombre
 * del fichero y el clic lo baja como blob con ese nombre, que el navegador
 * guarda aunque la respuesta no traiga Content-Disposition. Si el fetch falla
 * se sigue el enlace, como antes; con Ctrl/Cmd/Shift o boton del medio, el
 * navegador hace lo suyo.
 */

import type { MouseEvent } from "react";
import { Download } from "lucide-react";
import type { PlantillaCarga } from "@/app/centro-operativo/contenido";

/** "Plantilla_Activos_Mapaal_v4.xlsx": el ultimo tramo de la ruta, sin query ni ancla. */
export function nombreDePlantilla(ruta: string): string {
  const nombre = ruta.split(/[?#]/)[0].split("/").pop() ?? "";
  return nombre || "plantilla.xlsx";
}

/** Baja `ruta` como blob y la guarda como `nombre`. false si la respuesta no es 2xx. */
export async function descargarPlantilla(ruta: string, nombre: string): Promise<boolean> {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) return false;
  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.rel = "noopener";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se revoca despues: algunos navegadores leen el blob tras el clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export function PlantillaDescarga({
  plantilla,
  testId,
}: {
  plantilla: PlantillaCarga | null | undefined;
  testId: string;
}) {
  if (!plantilla) return null;
  const { ruta } = plantilla;
  const nombre = nombreDePlantilla(ruta);

  function alClic(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const seguirEnlace = () => window.location.assign(ruta);
    descargarPlantilla(ruta, nombre)
      .then((ok) => {
        if (!ok) seguirEnlace();
      })
      .catch(seguirEnlace);
  }

  return (
    <div className="mt-4">
      <a
        href={ruta}
        download={nombre}
        onClick={alClic}
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
