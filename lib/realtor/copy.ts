import type { DataStatus } from "./types";

export const STATUS_LABEL: Record<DataStatus, string> = {
  LIVE: "LIVE", HISTORICAL: "HISTORICAL", ESTIMATED: "ESTIMATED", DEMO: "DEMO", UNAVAILABLE: "Sin datos",
};

export const STATUS_EXPLAIN: Record<DataStatus, string> = {
  LIVE: "Dato actual de una fuente conectada.",
  HISTORICAL: "Dato de un periodo pasado; puede haber cambiado.",
  ESTIMATED: "Estimación calculada; es una aproximación, no una medición.",
  DEMO: "Dato de ejemplo para ver el diseño. No es real.",
  UNAVAILABLE: "Sin dato: la fuente no está disponible.",
};

export const INTRO =
  "Explora la demanda en cualquier lugar del mundo: intención de búsqueda, compras registradas y conversiones de tu CRM. Son señales para decidir contenido y estrategia, no certezas.";

export const FAIR_HOUSING_NOTE =
  "Cumplimiento de Fair Housing: el radar sugiere contenido, idioma y estrategia. No sirve para elegir a quién mostrar un anuncio ni para excluir personas por origen nacional u otra clase protegida. Solo se muestran datos agregados.";

export const DEMO_BANNER = "Datos DEMO: ejemplos para revisar el diseño. No usar en informes.";

/** Avisos cuando el módulo no se muestra: dicen el motivo, nunca datos. */
export const ACCESS_NOTICE = {
  apagado: "Real Estate no está activado en este entorno.",
  comprobando: "Comprobando tu acceso a Real Estate…",
  "sin-acceso": "Tu usuario no tiene acceso a Real Estate en esta organización. Pide acceso a un administrador.",
  // Tiene Real Estate, pero no el rol de broker (ROP-UX-ROUTING): no decir «sin acceso a Real Estate».
  "sin-rol-broker": "La Bandeja del broker es solo para el broker del brokerage. Tu rol en Real Estate no la incluye; si la necesitas, pide el rol de broker a un administrador.",
  error: "No se pudo comprobar tu acceso a Real Estate (error de red o del servidor). Vuelve a intentarlo en unos minutos.",
} as const;

export const HOME_INTRO = "Herramientas de Real Estate disponibles para tu usuario.";
