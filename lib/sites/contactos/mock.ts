import type { Lead } from "./types";

/** Mocks SINTETICOS del modo DEMO (siempre con badge DEMO). Almacen en memoria; sin red. */
const T = "2026-11-07T15:00:00Z";
const base = (n: number, extra: Partial<Lead>): Lead => ({
  id: `00000000-0000-4000-8000-00000000c0${n}`, tenant_id: "00000000-0000-4000-8000-0000000000a1", vertical: "realestate",
  site_id: "00000000-0000-4000-8000-0000000000b1", idempotency_key: `synth-idem-000000${n}`, name: `Visitante SYNTH ${n}`,
  email: `visitante${n}@synth.invalid`, message: "Quiero ver este condominio.", locale: "es", source_page: "/es/propiedades/synth-condo-01",
  consents: [{ consent_id: `00000000-0000-4000-8000-00000000d0${n}`, channel: "email", status: "granted", text_version: "consent-email-2026-10", text_locale: "es", recorded_at: T }],
  contactable_channels: ["email"], status: "projected", created_at: T, ...extra,
});
const inicial = (): Lead[] => [
  base(1, { ad_click: { click_consent: "granted", gclid: "SYNTH-gclid-0001" } }),
  base(2, { status: "received", ad_click: { click_consent: "denied" } }),
];
let almacen = inicial();
export const listDemoLeads = (): Lead[] => [...almacen];
export const resetDemoLeads = (): void => { almacen = inicial(); };
