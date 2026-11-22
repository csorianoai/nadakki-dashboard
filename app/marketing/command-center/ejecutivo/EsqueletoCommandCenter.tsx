import "@/components/analytics/kit/tema.css";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import type { TemaPantalla } from "./tipos";

/**
 * Esqueleto con las dimensiones de la pantalla ya cargada (cabecera, fila de tres KPI y grafico), para que al llegar los datos no haya
 * salto de layout. Sin estado ni logica: se sirve en el HTML del servidor mientras se hidrata y mientras llega la primera respuesta.
 * Alturas medidas en la pantalla patron (README, criterio 1: KPI 211-511 px a 1440x900; grafico ~320 px).
 */
export function EsqueletoCommandCenter({ tema = "dark" }: { tema?: TemaPantalla }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando el Command Center"
      data-testid="esqueleto-command-center"
      data-theme={tema}
      className="forge-app kit-tema kit-fondo min-h-screen"
    >
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-5">
        <div className="flex h-[88px] flex-col gap-3 border-b kit-bd pb-4">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          <Skeleton className="col-span-2 h-[300px] w-full sm:col-span-1" />
          <Skeleton className="hidden h-[300px] w-full sm:block" />
          <Skeleton className="hidden h-[300px] w-full sm:block" />
        </div>
        <Skeleton className="h-[320px] w-full" />
      </div>
    </div>
  );
}
