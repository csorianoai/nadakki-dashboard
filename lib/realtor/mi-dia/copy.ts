/** Textos de Mi día en ES (por defecto) y EN. Sin términos técnicos. */
export const miDiaEs = {
  title: "Mi día", greeting: "Buenos días. Este es tu plan.",
  intro: "Tu agenda de hoy: lo que necesita una respuesta o un documento antes de seguir.",
  demoRef: "fecha de referencia DEMO · fecha fija reproducible",
  demoTag: "DEMO · datos sintéticos",
  empty: "Sin datos todavía",
  emptyNote: "Cuando haya fuentes conectadas, tu agenda aparecerá aquí.",
  unavailable: "NO_DISPONIBLE",
  unavailableNote: "Sin fuente conectada.",
  leads: "Leads sin primera respuesta", listings: "Listings con requisitos bloqueantes",
  desk: "Pendientes del broker desk",
  waiting: "esperando", hours: "h", blockers: { missing_disclosure: "Falta la divulgación firmada", missing_listing_agreement: "Falta el acuerdo de listado" } as Record<string, string>,
  blockerUnknown: "Falta un requisito por completar",
  deskNote: "Solo visible en la vista Broker.",
  fair: "Cumplimiento de Fair Housing: la agenda ordena por espera y requisitos, nunca por características de las personas.",
};
export type MiDiaCopy = typeof miDiaEs;
export const miDiaEn: MiDiaCopy = {
  title: "My day", greeting: "Good morning. This is your plan.",
  intro: "Your agenda for today: what needs a reply or a document before moving on.",
  demoRef: "DEMO reference date · fixed reproducible date",
  demoTag: "DEMO · synthetic data",
  empty: "No data yet",
  emptyNote: "Once sources are connected, your agenda will show up here.",
  unavailable: "NOT_AVAILABLE",
  unavailableNote: "No connected source.",
  leads: "Leads without a first reply", listings: "Listings with blocking requirements",
  desk: "Broker desk pending items",
  waiting: "waiting", hours: "h", blockers: { missing_disclosure: "Signed disclosure is missing", missing_listing_agreement: "Listing agreement is missing" },
  blockerUnknown: "A requirement is still missing",
  deskNote: "Only visible in the Broker view.",
  fair: "Fair Housing compliance: the agenda sorts by waiting time and requirements, never by personal characteristics.",
};
export const miDiaCopy = (lang: string): MiDiaCopy => (lang.toLowerCase().startsWith("en") ? miDiaEn : miDiaEs);
export const blockerText = (t: MiDiaCopy, code: string): string => t.blockers[code] ?? t.blockerUnknown;
