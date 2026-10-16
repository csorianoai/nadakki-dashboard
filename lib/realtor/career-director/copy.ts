/** Textos ES/EN de Career Director. Sin runtime de traducción: el panel elige el objeto. */
export type Lang = "es" | "en";

const es = {
  title: "Career Director",
  intro: "Tu carrera como agente: licencia y vencimiento, supervisión y metas. Es una guía para planificar, no una verificación oficial.",
  demoBanner: "DEMO · datos sintéticos",
  empty: "Sin datos todavía",
  emptyHint: "Cuando tu licencia, tu supervisor y tus metas estén registrados aparecerán aquí.",
  unavailable: "NO_DISPONIBLE",
  unavailableHint: "Sin fuente de datos por ahora.",
  license: "Licencia", expiry: "Vencimiento", state: "Estado", number: "Número", jurisdiction: "Jurisdicción",
  daysLeft: (n: number) => (n < 0 ? `Vencida hace ${-n} días` : `Faltan ${n} días`),
  supervision: "Supervisión", supervisor: "Supervisor", contact: "Contacto", lastReview: "Última revisión",
  goals: "Metas", goalOf: "de", lang: "EN",
  langLabel: "Idioma / Language",
  note: "Esta pantalla no filtra ni usa datos de clase protegida. El idioma preferido no limita nada.",
  states: { active: "Vigente", expiring: "Por vencer" },
  period: "Periodo", activity: "Actividad", volume: "Volumen cerrado", achievements: "Logros",
  volumeHint: "Un total por tipo y moneda; nunca se suman monedas ni ventas con rentas.",
  noVolume: "Sin cierres con precio en el periodo.", noAchievements: "Ningún logro todavía.",
  metricLabels: { closings_count: "Cierres del periodo", showings_count: "Visitas realizadas", active_listings: "Captaciones activas" } as Record<string, string>,
  kinds: { sale: "Venta", rental: "Renta mensual" },
  achievementLabels: { first_closing: "Primer cierre", ten_closings: "Diez cierres", first_showing: "Primera visita", hundred_showings: "Cien visitas" },
};
export type CareerCopy = typeof es;

const en: CareerCopy = {
  title: "Career Director",
  intro: "Your career as an agent: license and expiry, supervision and goals. It is a planning guide, not an official verification.",
  demoBanner: "DEMO · synthetic data",
  empty: "No data yet",
  emptyHint: "Once your license, supervisor and goals are registered they will show up here.",
  unavailable: "NO_DISPONIBLE",
  unavailableHint: "No data source for now.",
  license: "License", expiry: "Expiry", state: "Status", number: "Number", jurisdiction: "Jurisdiction",
  daysLeft: (n: number) => (n < 0 ? `Expired ${-n} days ago` : `${n} days left`),
  supervision: "Supervision", supervisor: "Supervisor", contact: "Contact", lastReview: "Last review",
  goals: "Goals", goalOf: "of", lang: "ES",
  langLabel: "Idioma / Language",
  note: "This screen does not filter on or use protected-class data. Preferred language limits nothing.",
  states: { active: "Active", expiring: "Expiring soon" },
  period: "Period", activity: "Activity", volume: "Closed volume", achievements: "Achievements",
  volumeHint: "One total per type and currency; currencies and sales/rentals are never added together.",
  noVolume: "No priced closings in the period.", noAchievements: "No achievements yet.",
  metricLabels: { closings_count: "Closings in period", showings_count: "Showings held", active_listings: "Active listings" },
  kinds: { sale: "Sale", rental: "Monthly rent" },
  achievementLabels: { first_closing: "First closing", ten_closings: "Ten closings", first_showing: "First showing", hundred_showings: "One hundred showings" },
};

export const COPY: Record<Lang, CareerCopy> = { es, en };
