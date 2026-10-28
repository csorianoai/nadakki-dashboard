"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Home } from "lucide-react";
import { migasDe } from "@/lib/migas";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRedirectPath } from "@/lib/auth/auth-context";

/** Alto de la barra; lo lee MarcoSuite para dar al resto de la carcasa el alto que queda. */
export const ALTO_BARRA_SUITE = 40;

type HistorialNavegador = { canGoBack?: boolean; canGoForward?: boolean; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };

/** Portada de la Suite: destino de Inicio mientras la sesión o los roles no están confirmados. */
export const INICIO_SEGURO = "/";

/**
 * Destino de «Inicio»: el mismo aterrizaje por rol que usa el login (getPostLoginRedirectPath, única fuente).
 * Un rol sin entrada explícita en ese mapa (bank_admin, compliance_officer) cae en "/" por la propia función.
 * Mientras la sesión carga o no hay roles, «Inicio» NO se queda sin enlace: apunta a "/" (la promesa es
 * «Inicio con un clic» para todo rol y el guard de sesión de "/" decide si hace falta redirigir).
 */
function useSesionOpcional(): Partial<ReturnType<typeof useAuth>> {
  // useAuth lanza sin AuthProvider (hooks/useAuth.ts). Su único hook (useContext) se llama siempre antes de lanzar,
  // así que atrapar aquí no cambia el orden de hooks: sin provider la barra sigue montándose y «Inicio» va a "/".
  try {
    return useAuth();
  } catch {
    return {};
  }
}

function useDestinoInicio(): string {
  const { allRoles = [], isLoading, isAuthenticated } = useSesionOpcional();
  return !isLoading && isAuthenticated && allRoles.length ? getPostLoginRedirectPath(allRoles) : INICIO_SEGURO;
}

/**
 * Navigation API (Chromium) para saber si hay atrás/adelante dentro de la aplicación. Sin ella (o con una
 * medición parcial) ambos botones quedan desactivados: history.length incluye páginas externas y un Atrás
 * ciego podría sacar al usuario de la Suite. Inicio y las migas siguen siendo la salida.
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

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400";
const BOTON =
  `inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white ${FOCO} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`;
/** «Inicio»: icono desde sm y texto desde lg (como «Nadakki»). Por debajo de sm queda el logotipo, que lleva al mismo Inicio: medido,
 * a 390 px la última miga quedaba en 2 px y a 768 px en 8 px visibles. */
const BOTON_INICIO = `${BOTON.replace("inline-flex", "hidden sm:inline-flex").replace("px-2", "w-7 justify-center px-0")} lg:w-auto lg:px-2`;
/**
 * Atrás/Adelante: borde zinc-500 (#71717a) sobre la barra zinc-950 (#09090b) ≈ 4,2:1 (WCAG 1.4.11 pide ≥3:1). Deshabilitado:
 * borde discontinuo y atenuado, distinto del activo sin depender solo del color. Solo desde md: a 390 px, con el mínimo de
 * 44 px por botón de app/globals.css, no caben junto a las acciones (en móvil queda el gesto «atrás» del sistema).
 */
const BOTON_HISTORIAL = `${BOTON.replace("inline-flex", "hidden md:inline-flex").replace("px-2", "w-7 justify-center px-0")} border border-zinc-500 disabled:border-dashed disabled:border-zinc-700`;

export type BarraSuiteProps = {
  /** Antes del logotipo (botón del menú en móvil). */
  antes?: ReactNode;
  /** Entre Atrás/Adelante y las migas (selector de módulos). */
  despues?: ReactNode;
  /** A la derecha de las migas (buscador, notificaciones, usuario). */
  derecha?: ReactNode;
};

/**
 * Barra fija de la Suite, encima de TODAS las carcasas (Suite, Credit Hub, Dealer OS, Realtor OS, Cockpit,
 * Contabilidad, Crédito): logotipo, «Inicio» y la primera miga llevan al aterrizaje del rol (login), Atrás y Adelante usan el
 * historial del navegador y las migas muestran Inicio › Módulo › Sección › Pantalla con enlace en cada nivel.
 * Estrecho (ROP-UX-NAV-MOVIL-BARRA): por debajo de sm, el logotipo sin «Inicio»; por debajo de lg, solo la última miga y sin los
 * textos «Nadakki» e «Inicio». Los controles no encogen (mínimo de 44 px de app/globals.css);
 * las migas son lo único que cede ancho y van centradas en el alto de la barra.
 */
export function BarraSuite({ antes, despues, derecha }: BarraSuiteProps = {}) {
  const pathname = usePathname();
  const inicio = useDestinoInicio();
  const migas = migasDe(pathname);
  const { atras, adelante } = useHistorial(pathname);
  return (
    <nav
      aria-label="Barra de la Suite"
      data-testid="barra-suite"
      style={{ height: ALTO_BARRA_SUITE }}
      className="relative z-[60] flex w-full min-w-0 max-w-full shrink-0 items-center gap-0.5 border-b border-zinc-800 bg-zinc-950 px-2 text-zinc-100 sm:gap-1 sm:px-3"
    >
      {antes}
      <Link href={inicio} data-testid="barra-suite-logo" aria-label="Nadakki: ir a mi Inicio" className={`inline-flex shrink-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-zinc-800 sm:mr-1 sm:px-1.5 ${FOCO}`}>
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded bg-amber-500 text-[13px] font-bold text-zinc-950">N</span>
        <span className="hidden text-sm font-semibold tracking-tight lg:inline">Nadakki</span>
      </Link>
      <Link href={inicio} data-testid="barra-suite-inicio" aria-label="Inicio" className={BOTON_INICIO}>
        <Home aria-hidden className="h-4 w-4" />
        <span className="hidden lg:inline">Inicio</span>
      </Link>
      <button type="button" data-testid="barra-suite-atras" aria-label="Atrás" title="Atrás" disabled={!atras} onClick={() => window.history.back()} className={BOTON_HISTORIAL}>
        <ArrowLeft aria-hidden className="h-4 w-4" />
      </button>
      <button type="button" data-testid="barra-suite-adelante" aria-label="Adelante" title="Adelante" disabled={!adelante} onClick={() => window.history.forward()} className={BOTON_HISTORIAL}>
        <ArrowRight aria-hidden className="h-4 w-4" />
      </button>
      {despues}
      <ol aria-label="Estás en" data-testid="barra-suite-migas" className="ml-1 flex min-w-0 flex-1 items-center gap-1 self-stretch overflow-hidden text-xs text-zinc-400 sm:ml-2">
        {migas.map((m, i) => {
          const ultima = i === migas.length - 1;
          return (
            <li key={`${m.href}-${i}`} className={`h-full min-w-0 items-center gap-1 ${ultima ? "flex" : "hidden lg:flex"}`}>
              {i > 0 ? <ChevronRight aria-hidden className={`h-3.5 w-3.5 shrink-0 text-zinc-600 ${ultima ? "hidden lg:block" : ""}`} /> : null}
              <Link
                href={i === 0 ? inicio : m.href}
                aria-current={ultima ? "page" : undefined}
                className={`flex min-w-0 items-center rounded px-1 py-0.5 hover:bg-zinc-800 hover:text-white ${FOCO} ${ultima ? "font-medium text-zinc-100" : ""}`}
              >
                {/* El enlace mide 44 px (mínimo de app/globals.css) en una barra de 40: centra el texto en vez de dejarlo arriba. */}
                <span className="truncate leading-5">{m.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {derecha}
    </nav>
  );
}
