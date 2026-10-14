"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Home } from "lucide-react";
import { migasDe } from "@/lib/migas";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";

/** Alto de la barra; lo lee MarcoSuite para dar al resto de la carcasa el alto que queda. */
export const ALTO_BARRA_SUITE = 40;

type HistorialNavegador = { canGoBack?: boolean; canGoForward?: boolean; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };

/** Sin Navigation API no se conoce el historial propio: ambos botones se desactivan.
 * No se usa history.length, que puede incluir páginas externas. Inicio sigue disponible con sesión medida.
 */
function useHistorial(pathname: string | null) {
  const [estado, setEstado] = useState({ atras: false, adelante: false });
  useEffect(() => {
    const nav = (globalThis as { navigation?: HistorialNavegador }).navigation;
    if (!nav || typeof nav.canGoBack !== "boolean" || typeof nav.canGoForward !== "boolean") {
      setEstado({ atras: false, adelante: false });
      return;
    }
    const leer = () => setEstado({ atras: Boolean(nav.canGoBack), adelante: Boolean(nav.canGoForward) });
    leer();
    nav.addEventListener?.("currententrychange", leer);
    return () => nav.removeEventListener?.("currententrychange", leer);
  }, [pathname]);
  return estado;
}

const BOTON =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * Barra fija de la Suite, encima de TODAS las carcasas (Suite, Credit Hub, Dealer OS, Realtor OS, Cockpit,
 * Contabilidad, Crédito): logotipo e «Inicio» llevan al aterrizaje del usuario medido por el login, Atrás y Adelante usan el
 * historial del navegador y las migas muestran Inicio › Módulo › Sección › Pantalla con enlace en cada nivel.
 */
export function BarraSuite() {
  const pathname = usePathname();
  const { allRoles = [], isLoading, isAuthenticated } = useAuth();
  const inicio = !isLoading && isAuthenticated && allRoles.length
    ? getPostLoginRedirectPath(allRoles) : null;
  const migas = migasDe(pathname);
  const { atras, adelante } = useHistorial(pathname);
  return (
    <nav
      aria-label="Barra de la Suite"
      data-testid="barra-suite"
      style={{ height: ALTO_BARRA_SUITE }}
      className="relative z-[60] flex shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-950 px-2 text-zinc-100 sm:px-3"
    >
      {inicio ? <Link href={inicio} data-testid="barra-suite-logo" aria-label="Nadakki: ir a mi Inicio" className="mr-1 inline-flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-zinc-800">
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded bg-amber-500 text-[13px] font-bold text-zinc-950">N</span>
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">Nadakki</span>
      </Link> : <span data-testid="barra-suite-logo" aria-disabled="true" className="mr-1 px-1.5 text-sm font-semibold">Nadakki</span>}
      {inicio ? <Link href={inicio} data-testid="barra-suite-inicio" className={BOTON}>
        <Home aria-hidden className="h-4 w-4" />
        <span>Inicio</span>
      </Link> : <span data-testid="barra-suite-inicio" aria-disabled="true" className={`${BOTON} opacity-40`}>Inicio</span>}
      <button type="button" data-testid="barra-suite-atras" aria-label="Atrás" title="Atrás" disabled={!atras} onClick={() => window.history.back()} className={BOTON}>
        <ArrowLeft aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" data-testid="barra-suite-adelante" aria-label="Adelante" title="Adelante" disabled={!adelante} onClick={() => window.history.forward()} className={BOTON}>
        <ArrowRight aria-hidden className="h-4 w-4" />
      </button>
      <ol aria-label="Estás en" data-testid="barra-suite-migas" className="ml-2 flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-xs text-zinc-400">
        {migas.map((m, i) => {
          const ultima = i === migas.length - 1;
          return (
            <li key={`${m.href}-${i}`} className={`flex min-w-0 items-center gap-1 ${!ultima && i > 0 ? "hidden md:flex" : ""}`}>
              {i > 0 ? <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-zinc-600" /> : null}
              {i === 0 && !inicio ? <span aria-disabled="true" className="truncate px-1 py-0.5">{m.label}</span> : <Link
                href={i === 0 ? inicio! : m.href}
                aria-current={ultima ? "page" : undefined}
                className={`truncate rounded px-1 py-0.5 hover:bg-zinc-800 hover:text-white ${ultima ? "font-medium text-zinc-100" : ""}`}
              >
                {m.label}
              </Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
