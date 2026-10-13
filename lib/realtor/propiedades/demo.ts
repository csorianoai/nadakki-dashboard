import type { Property } from "./types";

/** Datos sintéticos (prefijo SYNTH). Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_PROPERTIES: readonly Property[] = [
  { id: "p1", address: "SYNTH Propiedad 1 · Unidad A", type: "condominio", status: "activa", stage: "marketing_showings",
    price: { amount: 485000, currency: "USD" }, units: [{ label: "SYNTH 1A", beds: 2, baths: 2 }, { label: "SYNTH 1B", beds: 3, baths: 2 }] },
  { id: "p2", address: "SYNTH Propiedad 2", type: "casa", status: "en_contrato", stage: "contract_contingencies",
    price: { amount: 1250000, currency: "USD" }, units: [{ label: "SYNTH 2", beds: 4, baths: 3 }] },
  { id: "p3", address: "SYNTH Propiedad 3", type: "townhouse", status: "activa", stage: "cma",
    price: { amount: 7800000, currency: "DOP" }, units: [{ label: "SYNTH 3", beds: 3, baths: 2 }] },
  { id: "p4", address: "SYNTH Propiedad 4", type: "terreno", status: "retirada", stage: "acquire",
    price: { amount: 210000, currency: "USD" }, units: [] },
  { id: "p5", address: "SYNTH Propiedad 5", type: "condominio", status: "vendida", stage: "closing",
    price: { amount: 399000, currency: "USD" }, units: [{ label: "SYNTH 5A", beds: 1, baths: 1 }] },
];
