import type { OperationType, RadarDataset, RadarFilters, RadarSignal } from "./types";

export const PILOT_FILTERS: RadarFilters = {
  country: "EE. UU.",
  region: "Florida",
  city: "Sunny Isles Beach",
  zone: "Collins Avenue",
  postalCode: "33160",
  operation: "alquiler",
};

export const COUNTRIES = ["EE. UU."];
export interface Place { region: string; city: string; zone: string; postalCode: string }
/** Lugares seleccionables por país: el select «Región · ciudad · zona» muestra «región › ciudad › zona». */
export const PLACES: Record<string, Place[]> = {
  "EE. UU.": [
    { region: "Florida", city: "Sunny Isles Beach", zone: "Collins Avenue", postalCode: "33160" },
    { region: "Florida", city: "Sunny Isles Beach", zone: "Intracoastal", postalCode: "33160" },
    { region: "Florida", city: "Miami", zone: "Brickell", postalCode: "33131" },
  ],
};
export const placeLabel = (p: Pick<Place, "region" | "city" | "zone">) => `${p.region} › ${p.city} › ${p.zone}`;

export const TABS = [
  { id: "intencion", label: "Intención de búsqueda" },
  { id: "compras", label: "Compras registradas" },
  { id: "crm", label: "Conversiones de tu CRM" },
] as const;
export type TabId = (typeof TABS)[number]["id"];

/** Índice relativo 0-100 por semana (S1–S8, S8 = semana actual). Datos sintéticos DEMO. */
const DEMO_INTENT: Record<OperationType, number[]> = {
  alquiler: [29, 49, 69, 39, 59, 79, 49, 69],
  venta: [61, 55, 58, 47, 52, 44, 49, 41],
};

function demoIntent(filters: RadarFilters): RadarSignal {
  return {
    id: "intencion",
    title: "Intención de búsqueda",
    signalType: "Interés de búsqueda (índice relativo)",
    source: "Tendencias de búsqueda (serie sintética DEMO)",
    asOf: "2026-10-10",
    status: "DEMO",
    unit: "índice 0-100",
    points: DEMO_INTENT[filters.operation].map((value, i) => ({ label: `S${i + 1}`, value })),
    note: `Serie de 8 semanas para ${filters.zone}. Es una señal relativa para decidir contenido, idioma y zona; no una cifra de clientes.`,
    period: "8 semanas · 16 ago – 10 oct 2026 (S8 = semana actual)",
    precision: "Índice relativo 0–100 · no es un número de personas",
  };
}

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

/** Las tres pestañas sin fuente conectada: UNAVAILABLE, sin barras ni cifras. */
export function unavailableTabs(): RadarSignal[] {
  return [
    unavailableSignal("intencion", "Intención de búsqueda", "Interés de búsqueda (índice relativo)", "Backend de señales (pendiente)"),
    unavailableSignal("compras", "Compras registradas", "Ventas registradas", "Fuente de transacciones (pendiente)"),
    unavailableSignal("crm", "Conversiones de tu CRM", "Conversiones agregadas", "CRM (pendiente)"),
  ];
}

export function buildDemoDataset(filters: RadarFilters): RadarDataset {
  const isPilot = filters.city === PILOT_FILTERS.city;
  const signals = isPilot
    ? [demoIntent(filters), ...unavailableTabs().slice(1)]
    : [unavailableSignal("sin-cobertura", "Cobertura de la zona", "Cobertura", "Nadakki")];
  return { filters, signals };
}

/** Señales sin fuente conectada, siempre UNAVAILABLE. */
export function pendingIntegrations(): RadarSignal[] {
  return [
    unavailableSignal("dr-trends", "Tendencia de búsqueda (Google Trends)", "Índice relativo de búsqueda", "DR-TRENDS (pendiente)"),
    unavailableSignal("dr-origen", "Procedencia de las búsquedas", "Procedencia geográfica agregada", "DR-ORIGEN (pendiente)"),
  ];
}
