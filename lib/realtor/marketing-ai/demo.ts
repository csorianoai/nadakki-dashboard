import type { GatewaySummary } from "./types";

/** Datos sintéticos (prefijo SYNTH). Solo con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_SUMMARIES: readonly GatewaySummary[] = [
  { id: "campaigns", headline: { es: "2 activas · 1 en revisión", en: "2 active · 1 in review" },
    items: [{ es: "SYNTH Campaña Vende con Brokerage", en: "SYNTH Sell with Brokerage campaign" }, { es: "SYNTH Campaña Open House", en: "SYNTH Open House campaign" }] },
  { id: "templates", headline: { es: "4 plantillas", en: "4 templates" },
    items: [{ es: "SYNTH Plantilla Nueva propiedad", en: "SYNTH New listing template" }, { es: "SYNTH Plantilla Casa abierta", en: "SYNTH Open house template" }] },
  { id: "posts", headline: { es: "3 publicaciones recientes", en: "3 recent posts" },
    items: [{ es: "SYNTH Publicación Aventura", en: "SYNTH Aventura post" }, { es: "SYNTH Publicación Bal Harbour", en: "SYNTH Bal Harbour post" }] },
  { id: "connections", headline: { es: "2 cuentas conectadas", en: "2 accounts connected" },
    items: [{ es: "SYNTH Cuenta Instagram", en: "SYNTH Instagram account" }, { es: "SYNTH Cuenta Facebook", en: "SYNTH Facebook account" }] },
];
