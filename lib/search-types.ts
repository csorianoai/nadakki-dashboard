/** Search filter types and facet constants — README §17.2 / §8.3 */

import { RD_PROVINCES_ORDERED } from "@/lib/rd-geography";

export type SearchView = "grid" | "list" | "map";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "payment_asc" | "match";

export type AiSignal = "precio-justo" | "match85" | "historial" | "sin-fraude";

export interface FilterState {
  query: string;
  brands: string[];
  types: string[];
  provinces: string[];
  years: number[];
  fuels: string[];
  trans: string[];
  condicion: string[];
  vendedor: string[];
  feats: string[];
  aiSignals: AiSignal[];
  maxMonthly: number;
  initial: number;
  usePayment: boolean;
  maxPrice?: number;
  minPrice?: number;
  sort: SortOption;
  view: SearchView;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  query: "",
  brands: [],
  types: [],
  provinces: [],
  years: [],
  fuels: [],
  trans: [],
  condicion: [],
  vendedor: [],
  feats: [],
  aiSignals: [],
  maxMonthly: 30_000,
  initial: 300_000,
  usePayment: false,
  sort: "relevance",
  view: "grid",
};

export const BRAND_OPTIONS = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "Suzuki",
  "Mitsubishi",
  "Mercedes-Benz",
  "BMW",
] as const;

export const TYPE_OPTIONS = ["Sedán", "SUV", "Premium"] as const;

export const PROVINCE_OPTIONS = RD_PROVINCES_ORDERED;

export const YEAR_OPTIONS = [2023, 2022, 2021, 2020, 2019] as const;

export const FUEL_OPTIONS = ["Gasolina", "Diésel", "Híbrido", "Eléctrico"] as const;

export const TRANS_OPTIONS = ["Automática", "Manual"] as const;

export const CONDICION_OPTIONS = ["Certificado Nadakki", "Usado"] as const;

export const VENDEDOR_OPTIONS = ["Dealer verificado", "Nadakki Particular Verificado"] as const;

export const FEAT_OPTIONS = [
  "Cuero",
  "Cámara 360°",
  "Sunroof",
  "Bluetooth",
  "CarPlay",
  "Navegación",
] as const;

export const AI_SIGNAL_OPTIONS: { id: AiSignal; label: string }[] = [
  { id: "precio-justo", label: "Solo Precio Justo verificado" },
  { id: "match85", label: "Match Score > 85%" },
  { id: "historial", label: "Historial verificado por AI" },
  { id: "sin-fraude", label: "Sin banderas de fraude" },
];

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "relevance", label: "Más relevantes" },
  { id: "price_asc", label: "Precio ↑" },
  { id: "price_desc", label: "Precio ↓" },
  { id: "payment_asc", label: "Cuota más baja" },
  { id: "match", label: "Mejor match" },
];
