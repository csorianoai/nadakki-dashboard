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
  /** Botón solo icono (28 px, no encoge) de la barra; con `md:` vuelve a llevar texto donde hace falta. */
  botonIcono: "inline-flex h-7 w-7 shrink-0 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  botonActivo: "bg-zinc-800 text-white",
  /** En móvil (<md) el desplegable se ancla al viewport bajo la barra (top-10) para no salirse por la derecha. */
  desplegable: "absolute left-0 top-full z-[70] mt-1 w-64 rounded-md border border-zinc-800 bg-zinc-950 p-1 shadow-xl max-md:fixed max-md:inset-x-2 max-md:top-10 max-md:w-auto",
  desplegableItem: "flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  desplegableActivo: "bg-zinc-800 text-white",
  tecla: "hidden rounded border border-zinc-700 px-1 text-[10px] text-zinc-400 lg:inline",
  acciones: "ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1",

  /** Menú lateral del módulo. */
  lateral: "fixed bottom-0 left-0 top-10 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[transform,width] duration-200 motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0",
  lateralPlegado: "lg:w-[60px]",
  lateralOculto: "-translate-x-full",
  lateralCabecera: "flex items-center gap-2 border-b border-zinc-800 px-3 py-3 text-sm font-semibold",
  telon: "fixed inset-0 z-40 bg-black/60 lg:hidden",
  grupo: "px-1 py-1",
  grupoTitulo: "flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  grupoTituloActivo: "!text-white",
  item: "flex min-h-8 items-center gap-2 rounded-md border-l-2 border-transparent py-1.5 pl-4 pr-3 text-xs text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400",
  itemActivo: "!border-[var(--acento-modulo,#a78bfa)] bg-zinc-800/60 text-white",
  insignia: "ml-auto shrink-0 rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide bg-amber-500/20 text-amber-400",

  /**
   * Pantalla del grupo y pestañas (César, 2026-10-13). El turquesa sale de --turquesa-modulo (ModuleShell lo
   * define; mismo matiz que el turquesa de DCC, #0EA5A4). Relieve: UNA sombra suave, elevación de 2 px al pasar
   * el ratón o enfocar; sin perspectiva ni transformaciones 3D; con prefers-reduced-motion no se mueve.
   */
  pantalla: "min-h-full bg-zinc-950 p-4 text-zinc-100 sm:p-6",
  rejilla: "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
  tarjeta: "group flex h-full flex-col gap-2 rounded-xl border border-[color-mix(in_srgb,var(--turquesa-modulo,#0ea5a4)_45%,transparent)] bg-zinc-900/60 p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--turquesa-modulo,#0ea5a4)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.45)] focus-visible:-translate-y-0.5 focus-visible:border-[var(--turquesa-modulo,#0ea5a4)] focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--turquesa-modulo,#0ea5a4)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0",
  tarjetaIcono: "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-[var(--turquesa-modulo,#0ea5a4)]",
  tarjetaTitulo: "text-sm font-semibold text-zinc-100",
  tarjetaDescripcion: "text-xs leading-snug text-zinc-400",

  /** Barra de pestañas del grupo: sobre el contenido, con flechas solo si hay desbordamiento. */
  pestanasBarra: "sticky top-0 z-10 flex items-stretch border-b border-zinc-800 bg-zinc-950",
  pestanasLista: "flex min-w-0 flex-1 scroll-px-2 snap-x snap-proximity gap-1 overflow-x-auto overscroll-x-contain px-2 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  pestana: "inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-t-md border border-b-2 border-transparent border-b-transparent px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--turquesa-modulo,#0ea5a4)]",
  pestanaActiva: "!border-zinc-700 !border-b-[var(--turquesa-modulo,#0ea5a4)] bg-zinc-900 !text-white",
  pestanasFlecha: "inline-flex w-8 shrink-0 items-center justify-center text-zinc-300 hover:bg-zinc-900 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--turquesa-modulo,#0ea5a4)]",
} as const;
