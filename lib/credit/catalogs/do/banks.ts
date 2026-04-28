export const DO_BANKS = [
  "Banco Popular Dominicano",
  "BanReservas",
  "Banco BHD",
  "Scotiabank",
  "Banco Santa Cruz",
  "Banco Caribe",
  "Banco Promerica",
  "Banco López de Haro",
  "Asociación Popular de Ahorros y Préstamos",
  "Asociación Cibao",
  "Asociación La Nacional",
  "APAP",
  "Cooperativa Credicefi",
  "Otros",
] as const;

export type DOBank = (typeof DO_BANKS)[number];
