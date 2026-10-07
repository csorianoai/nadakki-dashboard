"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { DccThemeProvider, useDccThemeContext } from "@/components/dcc/DccThemeContext";
import { dccThemeStyle } from "@/lib/dcc/tokens";
import { dccFontVariables } from "./DccFonts";
import { DccShellSidebar } from "./DccShellSidebar";
import { DccShellTopbar } from "./DccShellTopbar";

export type DccNavItem = { id: string; label: string; href: string; icon: LucideIcon };
export type DccNavGroup = { label: string; items: DccNavItem[] };
export type DccMiga = { label: string; href?: string };
export type DccUsuario = { nombre: string; rol: string; iniciales: string };

export type DccShellProps = {
  /** Firma del producto bajo la marca, p. ej. "con Nadakki Credit Hub". */
  firma: string;
  /** Nombre y logo del tenant (branding). null = no se pinta. */
  marca: { nombre: string | null; logoUrl: string | null };
  grupos: DccNavGroup[];
  /** `id` del item activo, o null. */
  activo: string | null;
  migas: DccMiga[];
  usuario: DccUsuario;
  onSalir?: () => void;
  /**
   * Clave de Local Storage para recordar el tema (como el dealer). Sin clave,
   * el tema dura la sesion en memoria.
   */
  temaStorageKey?: string;
  /** Controles extra de la barra superior (buscador, campana), antes del conmutador de tema. */
  extrasCabecera?: ReactNode;
  children: ReactNode;
};

/**
 * Tipografia del shell: la misma del panel del dealer (Sora, IBM Plex Sans y
 * Mono), acotada a esta raiz. `.font-dealer-numeric` es la clase de cifra de
 * DCC_CLASSES; aqui sale en mono igual que dentro del dealer.
 */
const TIPOGRAFIA = [
  "font-[family-name:var(--font-ibm-plex-sans),ui-sans-serif,system-ui,sans-serif]",
  "[&_:is(h1,h2,h3)]:font-[family-name:var(--font-sora),var(--font-ibm-plex-sans),ui-sans-serif,sans-serif]",
  "[&_:is(h1,h2,h3)]:tracking-[-0.01em]",
  "[&_.font-dealer-numeric]:font-[family-name:var(--font-ibm-plex-mono),ui-monospace,monospace]",
  "[&_.font-dealer-numeric]:tabular-nums",
].join(" ");

/**
 * Shell de presentacion del sistema DCC: barra lateral marina con el item
 * activo en dorado, barra superior con migas, conmutador de tema y usuario.
 * Todo llega por props; no sabe de ningun portal. El tema se comparte con las
 * paginas (DccThemeContext) y se recuerda si el llamador da `temaStorageKey`.
 * El conmutador vive SOLO en la barra superior: las cabeceras de pagina no
 * repiten el suyo.
 */
export function DccShell(props: DccShellProps) {
  return (
    <DccThemeProvider storageKey={props.temaStorageKey} conmutadorEnChrome>
      <DccShellChrome {...props} />
    </DccThemeProvider>
  );
}

function DccShellChrome({ firma, marca, grupos, activo, migas, usuario, onSalir, extrasCabecera, children }: Omit<DccShellProps, "temaStorageKey">) {
  const contexto = useDccThemeContext();
  const theme = contexto?.theme ?? "light";
  const [menuMovil, setMenuMovil] = useState(false);
  return (
    <div
      data-dcc-shell=""
      data-dcc-theme={theme}
      style={dccThemeStyle(theme)}
      className={`${dccFontVariables} ${TIPOGRAFIA} flex min-h-screen overflow-x-hidden bg-[var(--dcc-canvas)] text-[var(--dcc-fg)] antialiased`}
    >
      <DccShellSidebar
        firma={firma}
        marca={marca}
        grupos={grupos}
        activo={activo}
        abiertoMovil={menuMovil}
        onCerrar={() => setMenuMovil(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DccShellTopbar
          migas={migas}
          usuario={usuario}
          theme={theme}
          onTheme={(t) => contexto?.setTheme(t)}
          onMenu={() => setMenuMovil(true)}
          onSalir={onSalir}
          extras={extrasCabecera}
        />
        <div className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">{children}</div>
      </div>
    </div>
  );
}

/**
 * Item activo: el de `href` mas largo que coincide con la ruta. La raiz de una
 * seccion solo cuenta si coincide exacta, para que no quede activa en todas.
 */
export function itemActivo(grupos: DccNavGroup[], pathname: string, raiz: string): string | null {
  let mejor: DccNavItem | null = null;
  for (const item of grupos.flatMap((g) => g.items)) {
    const coincide =
      item.href === raiz ? pathname === raiz : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (coincide && (!mejor || item.href.length > mejor.href.length)) mejor = item;
  }
  return mejor?.id ?? null;
}
