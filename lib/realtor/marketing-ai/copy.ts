export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Marketing AI",
    intro: "El motor de captación: campañas, contenido y publicaciones en un solo lugar.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas campañas, plantillas o redes conectadas aparecerán aquí.",
    gatewaysTitle: "Tu marketing",
    gatewaysNote: "Solo consulta: desde aquí no se lanza ni se publica nada.",
    open: "Abrir",
    lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: el contenido y la audiencia nunca usan clase protegida.",
  },
  en: {
    title: "Marketing AI",
    intro: "The lead-generation engine: campaigns, content and posts in one place.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have campaigns, templates or connected networks they will show up here.",
    gatewaysTitle: "Your marketing",
    gatewaysNote: "View only: nothing is launched or published from here.",
    open: "Open",
    lang: "Screen language",
    fairHousing: "Fair Housing compliance: content and audience never use a protected class.",
  },
} as const;
