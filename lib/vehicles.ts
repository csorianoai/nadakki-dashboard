/** Seed inventory — README §7 + §17.4 enrichment fields. */

export type VehicleType = "Sedán" | "SUV" | "SUV Premium" | "Premium";

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  loc: string;
  type: VehicleType;
  km: number;
  trans: string;
  fuel: string;
  badge: string;
  match: number;
  grad: string;
  verified: boolean;
  rating: number;
  reviews: number;
  featuresLine: string;
  dealerName: string;
  avgResp: string;
}

const DEALERS = ["AutoMundo RD", "Motores del Este", "Autos del Cibao", "Caribe Motors"] as const;
const AVG_RESP = ["15 min", "1 hora", "30 min", "2 horas"] as const;

const FEATURES: Record<number, string> = {
  1: "AUTOMÁTICO · CÁMARA REVERSA · BLUETOOTH · CARPLAY",
  2: "AUTOMÁTICO · CUERO · CÁMARA 360° · SUNROOF",
  3: "AUTOMÁTICO · PANTALLA · BLUETOOTH · SEGURIDAD",
  4: "AUTOMÁTICO · CUERO · CÁMARA 360° · NAVEGACIÓN",
  5: "AUTOMÁTICO · AIRE · BLUETOOTH · RADIO",
  6: "AUTOMÁTICO · CÁMARA · BLUETOOTH · CARPLAY",
  7: "AUTOMÁTICO · CUERO · SUNROOF · CÁMARA 360°",
  8: "AUTOMÁTICO · CUERO · PANTALLA · CARPLAY",
  9: "AUTOMÁTICO · CUERO · CÁMARA 360° · SUNROOF",
  10: "AUTOMÁTICO · CUERO · NAVEGACIÓN · SUNROOF",
};

function enrich(
  base: Omit<Vehicle, "featuresLine" | "dealerName" | "avgResp">,
): Vehicle {
  return {
    ...base,
    featuresLine: FEATURES[base.id] ?? "AUTOMÁTICO · GASOLINA",
    dealerName: base.verified ? DEALERS[base.id % 4]! : "Nadakki Particular",
    avgResp: AVG_RESP[base.id % 4]!,
  };
}

export const VEHICLES_SEED: Vehicle[] = [
  enrich({
    id: 1,
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    price: 1_180_000,
    loc: "Distrito Nacional",
    type: "Sedán",
    km: 38_400,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Excelente oportunidad",
    match: 94,
    grad: "linear-gradient(135deg,#1E3A8A,#3B82F6)",
    verified: true,
    rating: 4.8,
    reviews: 126,
  }),
  enrich({
    id: 2,
    make: "Honda",
    model: "CR-V",
    year: 2021,
    price: 1_650_000,
    loc: "Santiago",
    type: "SUV",
    km: 52_100,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 88,
    grad: "linear-gradient(135deg,#0F766E,#14B8A6)",
    verified: true,
    rating: 4.7,
    reviews: 98,
  }),
  enrich({
    id: 3,
    make: "Hyundai",
    model: "Tucson",
    year: 2023,
    price: 1_890_000,
    loc: "La Vega",
    type: "SUV",
    km: 19_800,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 82,
    grad: "linear-gradient(135deg,#1D4ED8,#60A5FA)",
    verified: true,
    rating: 4.6,
    reviews: 74,
  }),
  enrich({
    id: 4,
    make: "Kia",
    model: "Sportage",
    year: 2022,
    price: 1_450_000,
    loc: "Santo Domingo Este",
    type: "SUV",
    km: 41_300,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Excelente oportunidad",
    match: 91,
    grad: "linear-gradient(135deg,#7C3AED,#A78BFA)",
    verified: true,
    rating: 4.9,
    reviews: 112,
  }),
  enrich({
    id: 5,
    make: "Suzuki",
    model: "Grand Vitara",
    year: 2019,
    price: 780_000,
    loc: "San Pedro de Macorís",
    type: "SUV",
    km: 78_600,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 76,
    grad: "linear-gradient(135deg,#B45309,#F59E0B)",
    verified: false,
    rating: 4.2,
    reviews: 41,
  }),
  enrich({
    id: 6,
    make: "Ford",
    model: "Escape",
    year: 2020,
    price: 1_050_000,
    loc: "Puerto Plata",
    type: "SUV",
    km: 61_200,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 79,
    grad: "linear-gradient(135deg,#0E7490,#22D3EE)",
    verified: true,
    rating: 4.4,
    reviews: 63,
  }),
  enrich({
    id: 7,
    make: "Mitsubishi",
    model: "Outlander",
    year: 2023,
    price: 1_580_000,
    loc: "Santiago",
    type: "SUV",
    km: 22_400,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Certificado Nadakki",
    match: 85,
    grad: "linear-gradient(135deg,#BE123C,#FB7185)",
    verified: true,
    rating: 4.5,
    reviews: 55,
  }),
  enrich({
    id: 8,
    make: "Chevrolet",
    model: "Blazer",
    year: 2021,
    price: 1_750_000,
    loc: "Distrito Nacional",
    type: "SUV",
    km: 44_900,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 80,
    grad: "linear-gradient(135deg,#334155,#94A3B8)",
    verified: true,
    rating: 4.3,
    reviews: 48,
  }),
  enrich({
    id: 9,
    make: "Mercedes-Benz",
    model: "GLC 300",
    year: 2022,
    price: 2_890_000,
    loc: "Santo Domingo",
    type: "SUV Premium",
    km: 28_700,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 87,
    grad: "linear-gradient(135deg,#111827,#6B7280)",
    verified: true,
    rating: 4.9,
    reviews: 37,
  }),
  enrich({
    id: 10,
    make: "BMW",
    model: "X3",
    year: 2021,
    price: 2_450_000,
    loc: "Santo Domingo",
    type: "SUV Premium",
    km: 35_200,
    trans: "Automática",
    fuel: "Gasolina",
    badge: "Precio justo",
    match: 83,
    grad: "linear-gradient(135deg,#1E293B,#64748B)",
    verified: true,
    rating: 4.7,
    reviews: 52,
  }),
];

export function getVehicleById(id: number | string): Vehicle | undefined {
  const n = typeof id === "string" ? Number(id) : id;
  return VEHICLES_SEED.find((v) => v.id === n);
}

export function photoCount(id: number): number {
  return 18 + (id * 3) % 12;
}

export const BODY_TYPES = [
  { key: "yipeta", label: "Yipeta / SUV", count: 342, tipo: "SUV" },
  { key: "sedan", label: "Sedán", count: 128, tipo: "Sedán" },
  { key: "camioneta", label: "Camioneta / Pickup", count: 96, tipo: "SUV" },
  { key: "guagua", label: "Guagua / Minivan", count: 54, tipo: "SUV" },
  { key: "deportivo", label: "Deportivo", count: 23, tipo: "Premium" },
  { key: "compacto", label: "Compacto", count: 87, tipo: "Sedán" },
  { key: "convertible", label: "Convertible", count: 12, tipo: "Premium" },
  { key: "lujo", label: "Lujo", count: 41, tipo: "Premium" },
] as const;

/** Body type tiles with consistent imagin.studio 3/4 renders. */
export const BODY_TYPE_TILES = [
  {
    label: "Yipeta / SUV",
    slug: "suv",
    count: 342,
    tipo: "SUV",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=toyota&modelFamily=rav4&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Sedán",
    slug: "sedan",
    count: 128,
    tipo: "Sedán",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=toyota&modelFamily=corolla&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Camioneta / Pickup",
    slug: "pickup",
    count: 96,
    tipo: "SUV",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=ford&modelFamily=f150&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Guagua / Minivan",
    slug: "minivan",
    count: 54,
    tipo: "SUV",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=honda&modelFamily=odyssey&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Deportivo",
    slug: "coupe",
    count: 23,
    tipo: "Premium",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=ford&modelFamily=mustang&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Compacto",
    slug: "hatchback",
    count: 87,
    tipo: "Sedán",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=toyota&modelFamily=yaris&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Convertible",
    slug: "convertible",
    count: 12,
    tipo: "Premium",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=bmw&modelFamily=z4&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
  {
    label: "Lujo",
    slug: "luxury",
    count: 41,
    tipo: "Premium",
    image:
      "https://cdn.imagin.studio/getimage?customer=demo&make=mercedes&modelFamily=eclass&modelYear=2023&angle=25&width=400&paintId=pspc0004",
  },
] as const;

/** Models available per brand for traditional search dropdowns. */
export const MODELS_BY_BRAND: Record<string, string[]> = {
  Toyota: ["Corolla", "Camry", "RAV4", "Highlander", "Prado", "Yaris", "Hilux"],
  Honda: ["Civic", "Accord", "CR-V", "HR-V", "Pilot", "Odyssey", "Ridgeline"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona", "Accent", "Palisade"],
  Kia: ["Rio", "Forte", "Sportage", "Sorento", "Telluride", "Soul", "Seltos"],
  Ford: ["Escape", "Edge", "Explorer", "F-150", "Mustang", "Focus", "Ecosport"],
  Chevrolet: ["Aveo", "Cruze", "Malibu", "Blazer", "Tahoe", "Silverado", "Trax"],
  Suzuki: ["Alto", "Swift", "Grand Vitara", "Jimny", "Vitara", "S-Cross"],
  Mitsubishi: ["Lancer", "Mirage", "Outlander", "Montero", "ASX", "L200", "Xpander"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLA", "CLA"],
  BMW: ["Serie 3", "Serie 5", "Serie 7", "X1", "X3", "X5", "X7"],
};
