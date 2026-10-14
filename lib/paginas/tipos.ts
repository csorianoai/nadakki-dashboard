/**
 * Tipos del manifiesto de páginas ("nada se pierde").
 *
 * Cada app/**\/page.tsx está clasificada en lib/paginas/manifiesto.json en UNA de estas categorías.
 * Lo comprueba tests/nav/manifiesto-paginas.test.ts contra el código real; lo mantiene
 * scripts/paginas/generar-manifiesto.mjs (README: docs/dashboard/MANIFIESTO_PAGINAS.md).
 */

export const MODULOS = [
  "concesionarios", "credito", "marketing", "contabilidad", "legal", "proyectos", "real-estate",
  "administracion", "suite", "publica", "otro",
] as const;
export type Modulo = (typeof MODULOS)[number];

export const CATEGORIAS = ["menu", "enlazada", "redirigida", "oculta", "pendiente-revision"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Si la versión nueva cubre todas las funciones de la página redirigida. El PR 7 solo borra las "completa". */
export type Cubre = "completa" | "parcial" | "sin-verificar";

/** El fichero debe existir y contener TODAS estas cadenas (el test lo lee; no se fía del manifiesto). */
export type Comprobacion = { archivo: string; contiene: string | string[] };

/** Fichero desde el que se llega a la página. Sin `contiene`, el test busca la ruta como href/push/Link. */
export type Origen = { archivo: string; contiene?: string | string[] };

export type FuenteMenu =
  | "navegacion" | "marketing-pestanas" | "bank-v2" | "dealer-nav" | "realtor" | "legal-subnav" | "legal-expediente"
  | "legal-investigacion" | "cockpit-finanzas" | "cockpit-sidebar" | "contable-subnav" | "bank-nav" | "credit-hub-sidebar"
  | "monetizacion-nav" | "sic-barra" | "proyectos-pestanas" | "proyectos-finanzas";

type Base = {
  /** URL de la página tal cual está en el árbol de app/ (sin los grupos (x)); las dinámicas con [param]. */
  ruta: string;
  /** Fichero page.tsx. */
  archivo: string;
  modulo: Modulo;
  /** "auto": lo clasifica el script y --write lo regenera. "manual": decisión leída en el código; --write la conserva. */
  origen: "auto" | "manual";
  motivo: string;
  evidencia: string;
  comprobaciones?: Comprobacion[];
};

export type EntradaMenu = Base & { categoria: "menu"; fuente: FuenteMenu; href: string };
export type EntradaEnlazada = Base & { categoria: "enlazada"; desde: Origen[] };
export type EntradaRedirigida = Base & {
  categoria: "redirigida";
  via: "next.config" | "pagina" | "middleware";
  destino: string;
  cubre: Cubre;
  /** Obligatorio si cubre = "parcial": las funciones que la versión nueva NO cubre. */
  noCubre?: string[];
  /** Obligatorio si cubre = "completa" (salvo página que es solo un redirect): cómo se comprobó. */
  verificacion?: string;
};
export type EntradaOculta = Base & {
  categoria: "oculta";
  tipo: "desarrollo" | "admin" | "copia-sin-enlace" | "flag" | "sistema";
  /** Viene de RUTAS_OCULTAS de lib/navigation.ts (el test exige que coincida). */
  rutasOcultas?: boolean;
  vigente?: string;
};
export type EntradaPendiente = Base & { categoria: "pendiente-revision" };

export type EntradaPagina = EntradaMenu | EntradaEnlazada | EntradaRedirigida | EntradaOculta | EntradaPendiente;
