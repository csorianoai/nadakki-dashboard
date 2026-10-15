import type { FinanceSummary, Operation } from "./types";

/** Datos sintéticos: prefijo SYNTH. Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_OPERATIONS: readonly Operation[] = [
  { id: "o1", code: "SYNTH Alquiler 0001", kind: "alquiler", stage: "propiedad", summary: { es: "Apartamento · Sunny Isles Beach · sin propiedad vinculada", en: "Apartment · Sunny Isles Beach · no property linked" } },
  { id: "o2", code: "SYNTH Alquiler 0002", kind: "alquiler", stage: "condiciones", summary: { es: "Condo · Aventura · renta y depósito por acordar", en: "Condo · Aventura · rent and deposit to be agreed" } },
  { id: "o3", code: "SYNTH Alquiler 0003", kind: "alquiler", stage: "requisitos", summary: { es: "Apartamento · Bal Harbour · faltan requisitos del inquilino", en: "Apartment · Bal Harbour · tenant requirements missing" } },
  { id: "o4", code: "SYNTH Alquiler 0004", kind: "alquiler", stage: "aprobacion", summary: { es: "Casa · North Miami Beach · espera la decisión del broker", en: "House · North Miami Beach · waiting for the broker's decision" } },
  { id: "o5", code: "SYNTH Alquiler 0005", kind: "alquiler", stage: "cierre", summary: { es: "Apartamento · Hallandale · firmado, falta el cierre", en: "Apartment · Hallandale · signed, closing pending" } },
  { id: "o6", code: "SYNTH Venta 0001", kind: "venta", stage: null, summary: { es: "Compraventa · Bal Harbour · oportunidad sin expediente", en: "Sale · Bal Harbour · opportunity without a file" } },
  { id: "o7", code: "SYNTH Venta 0002", kind: "venta", stage: null, summary: { es: "Compraventa · Aventura · oportunidad sin expediente", en: "Sale · Aventura · opportunity without a file" } },
];

/** Cifras sintéticas de Finanzas (solo DEMO). Los importes salen de las operaciones SYNTH de arriba. */
export const DEMO_FINANCE: FinanceSummary = { gross: 6400, feePct: 8, agentPct: 70, brokerPct: 30, closed: 1 };
