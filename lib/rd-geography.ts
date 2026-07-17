/** República Dominicana geography — 31 provincias + sort helpers. */

export const RD_PROVINCES = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "La Vega",
  "San Cristóbal",
  "Puerto Plata",
  "San Pedro de Macorís",
  "Duarte",
  "La Romana",
  "Barahona",
  "Monseñor Nouel",
  "Espaillat",
  "Azua",
  "San Juan",
  "Peravia",
  "Valverde",
  "Monte Cristi",
  "María Trinidad Sánchez",
  "Sánchez Ramírez",
  "Samaná",
  "El Seibo",
  "Hato Mayor",
  "Monte Plata",
  "Bahoruco",
  "Independencia",
  "Pedernales",
  "Dajabón",
  "Elías Piña",
  "Hermanas Mirabal",
  "La Altagracia",
  "Santiago Rodríguez",
] as const;

const RD_PRIMARY = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "La Vega",
] as const;

const PRIMARY_SET = new Set<string>([...RD_PRIMARY]);

/** Primary metros first, remainder alphabetical. */
export const RD_PROVINCES_ORDERED: string[] = [
  ...RD_PRIMARY,
  ...RD_PROVINCES.filter((p) => !PRIMARY_SET.has(p)).sort((a, b) => a.localeCompare(b, "es")),
];

export type RDProvince = (typeof RD_PROVINCES)[number];
