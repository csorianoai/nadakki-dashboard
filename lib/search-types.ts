/** Search filter types and facet constants — README §17.2 / §8.3 */

import { RD_PROVINCES_ORDERED } from "@/lib/rd-geography";

export type SearchView = "grid" | "list" | "map";

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "payment_asc"
  | "match"
  | "km_asc"
  | "km_desc"
  | "year_desc"
  | "year_asc";

export type AiSignal = "precio-justo" | "match85" | "historial" | "sin-fraude";

export interface FilterState {
  query: string;
  brands: string[];
  model: string;
  trim: string;
  types: string[];
  provinces: string[];
  locationRadius: number;
  years: number[];
  yearMin?: number;
  yearMax?: number;
  fuels: string[];
  trans: string[];
  condicion: string[];
  vendedor: string[];
  sellerType: string;
  feats: string[];
  aiSignals: AiSignal[];
  maxMonthly: number;
  initial: number;
  usePayment: boolean;
  maxPrice?: number;
  minPrice?: number;
  priceReduced: boolean;
  priceBadges: string[];
  colors: string[];
  kmMin?: number;
  kmMax?: number;
  kmVerifiedOnly: boolean;
  drivetrain: string[];
  engines: string[];
  seats?: number;
  doors?: number;
  publishedSince: string;
  keyword: string;
  pageSize: number;
  sort: SortOption;
  view: SearchView;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  query: "",
  brands: [],
  model: "",
  trim: "",
  types: [],
  provinces: [],
  locationRadius: 25,
  years: [],
  fuels: [],
  trans: [],
  condicion: [],
  vendedor: [],
  sellerType: "Todos",
  feats: [],
  aiSignals: [],
  maxMonthly: 30_000,
  initial: 300_000,
  usePayment: false,
  priceReduced: false,
  priceBadges: [],
  colors: [],
  kmVerifiedOnly: false,
  drivetrain: [],
  engines: [],
  publishedSince: "any",
  keyword: "",
  pageSize: 20,
  sort: "relevance",
  view: "list",
};

export const BRAND_OPTIONS = [
  "Toyota",
  "Honda",
  "Hyundai",
  "Kia",
  "Ford",
  "Chevrolet",
  "Mercedes-Benz",
  "BMW",
  "Nissan",
  "Mazda",
  "Suzuki",
  "Mitsubishi",
  "Volkswagen",
  "Lexus",
  "Audi",
  "Jeep",
] as const;

export const BODY_TYPE_OPTIONS = [
  "Yipeta / SUV",
  "Sedán",
  "Camioneta / Pickup",
  "Guagua / Minivan",
  "Deportivo",
  "Compacto",
  "Convertible",
  "Lujo",
] as const;

export const TYPE_OPTIONS = BODY_TYPE_OPTIONS;

export const PROVINCE_OPTIONS = RD_PROVINCES_ORDERED;

export const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => 2015 + i).reverse();

export const FUEL_OPTIONS = ["Gasolina", "Diésel", "Híbrido", "Eléctrico", "GLP"] as const;

export const TRANS_OPTIONS = ["Automática", "Manual", "CVT"] as const;

export const CONDICION_OPTIONS = ["Nuevo", "Usado", "Certificado", "Con daños reportados"] as const;

export const SELLER_TYPE_OPTIONS = ["Todos", "Dealer verificado", "Nadakki Particular Verificado"] as const;

export const VENDEDOR_OPTIONS = ["Dealer verificado", "Nadakki Particular Verificado"] as const;

export const DRIVETRAIN_OPTIONS = ["4x2 (delantera)", "4x2 (trasera)", "4x4", "AWD"] as const;

export const ENGINE_OPTIONS = ["1.4L", "1.6L", "2.0L", "2.4L", "3.0L V6", "V8"] as const;

export const SEAT_OPTIONS = [2, 4, 5, 7, 8] as const;

export const DOOR_OPTIONS = [2, 4] as const;

export const PUBLISHED_OPTIONS = [
  { id: "24h", label: "Recién publicado (24h)" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "30d", label: "Últimos 30 días" },
  { id: "any", label: "Cualquier fecha" },
] as const;

export const POPULAR_LOCATIONS = ["Santo Domingo", "Santiago", "La Vega", "Puerto Plata"] as const;

export const FEAT_OPTIONS = [
  "Aire acondicionado",
  "Cámara 360°",
  "Cámara reversa",
  "Cuero",
  "Sunroof",
  "Techo panorámico",
  "Bluetooth",
  "CarPlay",
  "Android Auto",
  "Navegación GPS",
  "Sensor de parqueo",
  "Control crucero",
  "Control crucero adaptivo",
  "Asientos calefactables",
  "Alarma",
  "Rines de aleación",
  "Faros LED",
] as const;

export const EXTERIOR_COLORS = [
  { name: "Beige", hex: "#D4C4A8" },
  { name: "Azul", hex: "#2563EB" },
  { name: "Marrón", hex: "#78350F" },
  { name: "Bronce", hex: "#B45309" },
  { name: "Amarillo", hex: "#EAB308" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Verde", hex: "#16A34A" },
  { name: "Rojo", hex: "#DC2626" },
  { name: "Negro", hex: "#111827" },
  { name: "Plateado", hex: "#CBD5E1" },
  { name: "Violeta", hex: "#7C3AED" },
  { name: "Blanco", hex: "#F8FAFC" },
  { name: "Naranja", hex: "#EA580C" },
  { name: "Dorado", hex: "#CA8A04" },
] as const;

export const PRICE_BADGE_OPTIONS = [
  "Excelente oportunidad",
  "Precio justo",
  "Precio equitativo",
  "Sobre el mercado",
] as const;

export const PAGE_SIZE_OPTIONS = [20, 40, 60] as const;

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
  { id: "km_asc", label: "Kilometraje ↑" },
  { id: "km_desc", label: "Kilometraje ↓" },
  { id: "year_desc", label: "Año más nuevo" },
  { id: "year_asc", label: "Año más antiguo" },
];
