/** Estados de dato permitidos: toda cifra del radar lleva uno. */
export const DATA_STATUSES = ["LIVE", "HISTORICAL", "ESTIMATED", "DEMO", "UNAVAILABLE"] as const;
export type DataStatus = (typeof DATA_STATUSES)[number];

export type OperationType = "alquiler" | "venta";

/** Filtros geográficos y de operación. Sin ningún atributo de personas (Fair Housing). */
export interface RadarFilters {
  country: string;
  region: string;
  city: string;
  zone: string;
  postalCode: string;
  operation: OperationType;
}

export interface SignalPoint {
  label: string;
  value: number;
}

/** Una señal agregada. Nunca perfiles individuales. */
export interface RadarSignal {
  id: string;
  title: string;
  signalType: string;
  source: string;
  /** Fecha ISO (YYYY-MM-DD) de la medición. */
  asOf: string;
  status: DataStatus;
  unit: string;
  points: SignalPoint[];
  note: string;
  /** Texto del período y de la precisión de la ficha; ausentes si no hay dato. */
  period?: string;
  precision?: string;
}

export interface RadarDataset {
  filters: RadarFilters;
  signals: RadarSignal[];
}
