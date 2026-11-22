// Nombres visibles en español de los agentes y módulos de Google Ads.
// Clave: id del backend. Para un id desconocido se deriva un nombre legible.

const AGENT_NAMES: Record<string, string> = {
  google_ads_budget_pacing_agent__googleadsbudgetpacingia: "Agente de ritmo de presupuesto",
  google_ads_strategist_agent__googleadsstrategistia: "Agente estratega",
  rsa_ad_copy_generator_agent__rsaadcopygeneratoria: "Generador de textos RSA",
};

const MODULE_TITLES: Record<string, string> = {
  m01: "Fundamentos de la plataforma",
  m02: "Estructura de la cuenta",
  m03: "Investigación de palabras clave",
  m04: "Palabras clave negativas",
  m05: "Nivel de calidad y posición del anuncio",
  m06: "Puja inteligente",
  m07: "Textos de anuncios responsivos",
  m08: "Extensiones y activos",
  m09: "Audiencias",
  m10: "Performance Max",
  m11: "Campañas de Shopping",
  m12: "Generación de demanda",
  m13: "Seguimiento de conversiones",
  m14: "Atribución y GA4",
  m15: "Conexión técnica con Google Ads",
};

export function agentDisplayName(backendId: string | null | undefined): string {
  const id = (backendId ?? "").trim();
  if (!id) return "Agente";
  const known = AGENT_NAMES[id];
  if (known) return known;
  const base = id
    .split("__")[0]
    .replace(/_agent$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!base) return "Agente";
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

export function moduleDisplayTitle(moduleId: string | null | undefined, fallback: string): string {
  return MODULE_TITLES[(moduleId ?? "").toLowerCase()] ?? fallback;
}
