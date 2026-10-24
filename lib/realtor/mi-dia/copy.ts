/** Textos de Mi día en ES (por defecto) y EN. Sin términos técnicos. */
export const miDiaEs = {
  title: "Mi día", greeting: "Buenos días. Este es tu plan.",
  intro: "Tu agenda de hoy: lo que necesita una respuesta o un documento antes de seguir.",
  demoRef: "DEMO · fecha de hoy",
  lang: "Idioma de la pantalla", dateLocale: "es-DO",
  demoTag: "DEMO · datos sintéticos",
  empty: "Sin datos todavía",
  emptyNote: "Cuando haya fuentes conectadas, tu agenda aparecerá aquí.",
  unavailable: "NO_DISPONIBLE",
  unavailableNote: "Sin fuente conectada.",
  leads: "Leads sin primera respuesta", listings: "Listings con requisitos bloqueantes",
  desk: "Pendientes del broker desk",
  waiting: "esperando", hours: "h", blockers: { missing_disclosure: "Falta la divulgación firmada", missing_listing_agreement: "Falta el acuerdo de listado" } as Record<string, string>,
  blockerUnknown: "Falta un requisito por completar",
  channels: { web: "Web", meta: "Meta", whatsapp: "WhatsApp", referral: "Referido", manual: "Manual" } as Record<string, string>,
  intents: { rent: "alquiler", buy: "compra", sell: "venta", lease_out: "poner en alquiler" } as Record<string, string>,
  deskKinds: { agent_activation: "Activación de agente", brand_publication: "Publicación de marca" } as Record<string, string>,
  leadFallback: "Lead", deskFallback: "Pendiente", blockingReqs: "requisitos bloqueantes", stage: "Etapa",
  visits: "Visitas de hoy", visitsEmpty: "Sin visitas programadas para hoy.", listingLabel: "Propiedad",
  visitStatus: { scheduled: "Programada", confirmed: "Confirmada", completed: "Realizada", cancelled: "Cancelada", no_show: "No asistió" } as Record<string, string>,
  visitFallback: "Visita",
  deskNote: "Solo visible en la vista Broker.",
  kpiLeads: "Leads por responder", kpiListings: "Listings bloqueados", kpiPlan: "Plan del día",
  kpiLeadsNote: "Esperando primera respuesta", kpiListingsNote: "Requisitos por completar", kpiPlanNote: "Pasos de hoy · muestra DEMO",
  nextLabel: "Recomendación principal", nextAction: "Responder al lead que más lleva esperando",
  nextDetail: "Ordenado solo por tiempo de espera y requisitos pendientes.", nextCta: "Ver propiedades",
  fair: "Cumplimiento de Fair Housing: la agenda ordena por espera y requisitos, nunca por características de las personas.",
};
export type MiDiaCopy = typeof miDiaEs;
export type Lang = "es" | "en";
/** Zona horaria del tenant: GET /api/v2/auth/me no la expone; tenants.country es 'DO' (Platform Operations). */
export const TENANT_TZ = "America/Santo_Domingo";
export const miDiaEn: MiDiaCopy = {
  title: "My day", greeting: "Good morning. This is your plan.",
  intro: "Your agenda for today: what needs a reply or a document before moving on.",
  demoRef: "DEMO · today's date",
  lang: "Screen language", dateLocale: "en-US",
  demoTag: "DEMO · synthetic data",
  empty: "No data yet",
  emptyNote: "Once sources are connected, your agenda will show up here.",
  unavailable: "NOT_AVAILABLE",
  unavailableNote: "No connected source.",
  leads: "Leads without a first reply", listings: "Listings with blocking requirements",
  desk: "Broker desk pending items",
  waiting: "waiting", hours: "h", blockers: { missing_disclosure: "Signed disclosure is missing", missing_listing_agreement: "Listing agreement is missing" },
  blockerUnknown: "A requirement is still missing",
  channels: { web: "Web", meta: "Meta", whatsapp: "WhatsApp", referral: "Referral", manual: "Manual" },
  intents: { rent: "rent", buy: "buy", sell: "sell", lease_out: "lease out" },
  deskKinds: { agent_activation: "Agent activation", brand_publication: "Brand publication" },
  leadFallback: "Lead", deskFallback: "Pending item", blockingReqs: "blocking requirements", stage: "Stage",
  visits: "Today's visits", visitsEmpty: "No visits scheduled for today.", listingLabel: "Property",
  visitStatus: { scheduled: "Scheduled", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", no_show: "No-show" },
  visitFallback: "Visit",
  deskNote: "Only visible in the Broker view.",
  kpiLeads: "Leads to answer", kpiListings: "Blocked listings", kpiPlan: "Plan of the day",
  kpiLeadsNote: "Waiting for a first reply", kpiListingsNote: "Requirements to complete", kpiPlanNote: "Today's steps · DEMO sample",
  nextLabel: "Main recommendation", nextAction: "Reply to the lead who has waited the longest",
  nextDetail: "Sorted only by waiting time and pending requirements.", nextCta: "View properties",
  fair: "Fair Housing compliance: the agenda sorts by waiting time and requirements, never by personal characteristics.",
};
export const COPY: Record<Lang, MiDiaCopy> = { es: miDiaEs, en: miDiaEn };
/** Fecha de hoy en la zona del tenant, con la locale del idioma elegido. */
export const todayText = (t: MiDiaCopy, now: Date = new Date()): string =>
  new Intl.DateTimeFormat(t.dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TENANT_TZ }).format(now);
export const blockerText = (t: MiDiaCopy, code: string): string => t.blockers[code] ?? t.blockerUnknown;
export const lookup = (m: Record<string, string>, k: string, fallback: string): string => m[k] ?? fallback;
