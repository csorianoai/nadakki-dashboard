import manifiesto from "./manifiesto.json";
import type { EntradaPagina } from "./tipos";

/** Todas las páginas de app/**\/page.tsx, clasificadas. Datos en manifiesto.json (lo regenera el script). */
export const MANIFIESTO_PAGINAS = manifiesto.paginas as unknown as EntradaPagina[];

export * from "./tipos";
