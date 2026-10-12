import type { RadarDataset, RadarFilters, RadarSignal } from "./types";

export const PILOT_FILTERS: RadarFilters = {
  country: "Estados Unidos",
  region: "Florida",
  city: "Sunny Isles Beach",
  zone: "Collins Avenue",
  postalCode: "33160",
  operation: "venta",
};

export const COUNTRIES = ["Estados Unidos"];
export const REGIONS: Record<string, string[]> = { "Estados Unidos": ["Florida"] };
export const CITIES: Record<string, string[]> = { Florida: ["Sunny Isles Beach"] };
export const ZONES: Record<string, string[]> = { "Sunny Isles Beach": ["Collins Avenue", "Intracoastal"] };
export const POSTAL_CODES: Record<string, string[]> = { "Sunny Isles Beach": ["33160"] };

/** Datos ilustrativos rotulados DEMO. No representan demanda real. */
const DEMO_SIGNALS: RadarSignal[] = [
  {
    id: "interes-busquedas",
    title: "Interés de búsqueda en la zona",
    signalType: "Interés de búsqueda (índice relativo)",
    source: "Muestra de demostración Nadakki",
    asOf: "2026-10-01",
    status: "DEMO",
    unit: "índice 0-100",
    points: [
      { label: "Jun", value: 42 },
      { label: "Jul", value: 47 },
      { label: "Ago", value: 51 },
      { label: "Sep", value: 49 },
    ],
    note: "Valores de ejemplo para revisar el diseño. No indican demanda real.",
  },
  {
    id: "oferta-publicada",
    title: "Propiedades publicadas",
    signalType: "Inventario de anuncios",
    source: "Muestra de demostración Nadakki",
    asOf: "2026-10-01",
    status: "DEMO",
    unit: "anuncios",
    points: [
      { label: "Jun", value: 120 },
      { label: "Jul", value: 118 },
      { label: "Ago", value: 126 },
      { label: "Sep", value: 131 },
    ],
    note: "Cifras de ejemplo. No son volúmenes reales del mercado.",
  },
];

/** Integraciones que aún no existen: se muestran UNAVAILABLE, nunca simuladas. */
export function unavailableSignal(id: string, title: string, signalType: string, source: string): RadarSignal {
  return {
    id,
    title,
    signalType,
    source,
    asOf: "—",
    status: "UNAVAILABLE",
    unit: "",
    points: [],
    note: "Esta fuente todavía no está conectada. No mostramos cifras hasta que exista el dato real.",
  };
}

export function buildDemoDataset(filters: RadarFilters): RadarDataset {
  const isPilot = filters.city === PILOT_FILTERS.city;
  const signals = isPilot
    ? DEMO_SIGNALS
    : [unavailableSignal("sin-cobertura", "Cobertura de la zona", "Cobertura", "Nadakki")];
  return { filters, signals };
}

/** Señales sin fuente conectada, siempre UNAVAILABLE. */
export function pendingIntegrations(): RadarSignal[] {
  return [
    unavailableSignal("fuente-mls", "Transacciones cerradas", "Ventas registradas", "Fuente de transacciones (pendiente)"),
    unavailableSignal("dr-trends", "Tendencia de búsqueda (Google Trends)", "Índice relativo de búsqueda", "DR-TRENDS (pendiente)"),
    unavailableSignal("dr-origen", "Procedencia de las búsquedas", "Procedencia geográfica agregada", "DR-ORIGEN (pendiente)"),
  ];
}
