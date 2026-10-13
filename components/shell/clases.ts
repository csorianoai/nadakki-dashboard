/**
 * TODO el estilo del armazón común de módulos vive aquí, en pocas clases con nombre. La propuesta visual de
 * Claude Design se reaplica cambiando este archivo (y, si hace falta, las variables CSS de `--acento-modulo`)
 * sin tocar la lógica de los componentes. Hoy: oscuro, zinc, los mismos tokens que BarraSuite y el menú de la Suite.
 */
export const CLASES = {
  /** Raíz del armazón (mismas fuentes y clase `forge-app` que GlobalForgeAppShell; `h-screen` lo adapta globals.css). */
  raiz: "forge-app flex h-screen flex-col overflow-hidden antialiased",
  cuerpo: "flex min-h-0 flex-1",
  columna: "flex min-h-0 min-w-0 flex-1 flex-col",
  contenido: "flex min-h-0 flex-1 flex-col overflow-y-auto",
  saltar: "sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded-md focus:bg-amber-400 focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-zinc-950",

  /** Barra superior: botones, desplegables y chips. */
  boton: "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-40",
  botonActivo: "bg-zinc-800 text-white",
  desplegable: "absolute left-0 top-full z-[70] mt-1 w-64 rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-xl",
  desplegableItem: "flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  desplegableActivo: "bg-zinc-800 text-white",
  tecla: "hidden rounded border border-zinc-700 px-1 text-[10px] text-zinc-400 md:inline",
  acciones: "ml-auto flex shrink-0 items-center gap-1",

  /** Menú lateral del módulo. */
  lateral: "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[transform,width] duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0",
  lateralPlegado: "lg:w-[60px]",
  lateralOculto: "-translate-x-full",
  lateralCabecera: "flex items-center gap-2 border-b border-zinc-800 px-3 py-3 text-sm font-semibold",
  telon: "fixed inset-0 z-40 bg-black/60 lg:hidden",
  grupo: "px-1 py-1",
  grupoTitulo: "flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  item: "flex min-h-8 items-center gap-2 rounded-md border-l-2 border-transparent py-1.5 pl-4 pr-3 text-xs text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  itemActivo: "!border-[var(--acento-modulo,#a78bfa)] bg-zinc-800/60 text-white",
  insignia: "ml-auto shrink-0 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-400",
} as const;
