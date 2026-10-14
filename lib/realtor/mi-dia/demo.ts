/** Datos sintéticos de Mi día. Solo se usan con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". Sin datos de clase protegida. */
export type LeadRow = { id: string; name: string; phone: string; email: string; source: string; waitingHours: number };
export type ListingRow = { id: string; title: string; blocker: string };
export type DeskRow = { id: string; title: string; agent: string };

export const DEMO_DATE = "2026-10-12";

export const DEMO_LEADS: readonly LeadRow[] = [
  { id: "SYNTH-L1", name: "SYNTH Contacto 1", phone: "555-0101", email: "synth1@example.invalid", source: "SYNTH portal", waitingHours: 5 },
  { id: "SYNTH-L2", name: "SYNTH Contacto 2", phone: "555-0102", email: "synth2@example.invalid", source: "SYNTH web", waitingHours: 22 },
  { id: "SYNTH-L3", name: "SYNTH Contacto 3", phone: "555-0103", email: "synth3@example.invalid", source: "SYNTH referido", waitingHours: 30 },
];

export const DEMO_LISTINGS: readonly ListingRow[] = [
  { id: "SYNTH-P1", title: "SYNTH Apartamento A · Collins Ave sur", blocker: "missing_disclosure" },
  { id: "SYNTH-P2", title: "SYNTH Casa B · Sunny Isles", blocker: "missing_listing_agreement" },
];

export const DEMO_DESK: readonly DeskRow[] = [
  { id: "SYNTH-D1", title: "SYNTH Aprobación de borrador de anuncio", agent: "SYNTH Agente 1" },
  { id: "SYNTH-D2", title: "SYNTH Revisión de expediente", agent: "SYNTH Agente 2" },
];
