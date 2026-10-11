import type { DataStatus } from "./types";

export const STATUS_LABEL: Record<DataStatus, string> = {
  LIVE: "LIVE",
  HISTORICAL: "HISTORICAL",
  ESTIMATED: "ESTIMATED",
  DEMO: "DEMO",
  UNAVAILABLE: "UNAVAILABLE",
};

export const STATUS_EXPLAIN: Record<DataStatus, string> = {
  LIVE: "Dato actual de una fuente conectada.",
  HISTORICAL: "Dato de un periodo pasado; puede haber cambiado.",
  ESTIMATED: "Estimación calculada; es una aproximación, no una medición.",
  DEMO: "Dato de ejemplo para ver el diseño. No es real.",
  UNAVAILABLE: "Sin dato: la fuente no está disponible.",
};

export const INTRO =
  "Estas son señales del mercado para orientar decisiones, no certezas. Muestran tendencias agregadas por zona; no predicen ventas ni identifican personas.";

export const FAIR_HOUSING_NOTE =
  "Cumplimiento de Fair Housing: el radar sugiere contenido, idioma y estrategia. No sirve para elegir a quién mostrar un anuncio ni para excluir personas por origen nacional u otra clase protegida. Solo se muestran datos agregados.";

export const DEMO_BANNER = "Datos DEMO: ejemplos para revisar el diseño. No usar en informes.";
