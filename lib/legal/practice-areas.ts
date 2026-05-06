/**
 * Registry canónico de áreas de práctica del derecho.
 * Esta lista es la ÚNICA fuente de verdad. Cualquier pantalla que filtre,
 * etiquete o renderice por área legal consume desde aquí.
 */

export type PracticeAreaSlug =
  | "bancario"
  | "civil"
  | "inmobiliario"
  | "laboral"
  | "tributario"
  | "penal"
  | "comercial"
  | "administrativo"
  | "notarial"
  | "marcario"
  | "intelectual"
  | "internacional"
  | "ambiental"
  | "migratorio"
  | "marítimo"
  | "minero"
  | "seguros"
  | "familia"
  | "constitucional";

export type PracticeAreaCategory =
  | "comercial_financiero"
  | "civil_familiar"
  | "publico"
  | "penal_litigio"
  | "trabajo"
  | "propiedad_intelectual"
  | "especializado";

export interface PracticeArea {
  slug: PracticeAreaSlug;
  display_es: string;
  display_en: string;
  category: PracticeAreaCategory;
  /** Base CSS variable name, e.g. --color-area-financial → soft/strong/border suffixes */
  color_token: string;
  description_es: string;
}

export const PRACTICE_AREAS: PracticeArea[] = [
  {
    slug: "bancario",
    display_es: "Bancario",
    display_en: "Banking",
    category: "comercial_financiero",
    color_token: "--color-area-financial",
    description_es: "Operaciones bancarias, crédito, garantías, regulación SIB",
  },
  {
    slug: "civil",
    display_es: "Civil",
    display_en: "Civil",
    category: "civil_familiar",
    color_token: "--color-area-civil",
    description_es: "Obligaciones, contratos, responsabilidad civil",
  },
  {
    slug: "inmobiliario",
    display_es: "Inmobiliario",
    display_en: "Real Estate",
    category: "civil_familiar",
    color_token: "--color-area-civil",
    description_es: "Registro, propiedad, hipotecas, Ley 108-05",
  },
  {
    slug: "laboral",
    display_es: "Laboral",
    display_en: "Labor",
    category: "trabajo",
    color_token: "--color-area-labor",
    description_es: "Contratos de trabajo, prestaciones, Código de Trabajo",
  },
  {
    slug: "tributario",
    display_es: "Tributario",
    display_en: "Tax",
    category: "comercial_financiero",
    color_token: "--color-area-financial",
    description_es: "Obligaciones fiscales, DGII, Código Tributario",
  },
  {
    slug: "penal",
    display_es: "Penal",
    display_en: "Criminal",
    category: "penal_litigio",
    color_token: "--color-area-criminal",
    description_es: "Delitos, procedimiento penal, Código Procesal Penal",
  },
  {
    slug: "comercial",
    display_es: "Comercial",
    display_en: "Commercial",
    category: "comercial_financiero",
    color_token: "--color-area-financial",
    description_es: "Sociedades, contratos comerciales, Ley 479-08",
  },
  {
    slug: "administrativo",
    display_es: "Administrativo",
    display_en: "Administrative",
    category: "publico",
    color_token: "--color-area-public",
    description_es: "Actos administrativos, contrataciones públicas",
  },
  {
    slug: "notarial",
    display_es: "Notarial",
    display_en: "Notarial",
    category: "especializado",
    color_token: "--color-area-specialized",
    description_es: "Actos notariales, fe pública",
  },
  {
    slug: "marcario",
    display_es: "Marcario",
    display_en: "Trademark",
    category: "propiedad_intelectual",
    color_token: "--color-area-ip",
    description_es: "Marcas, signos distintivos, ONAPI",
  },
  {
    slug: "intelectual",
    display_es: "Propiedad Intelectual",
    display_en: "Intellectual Property",
    category: "propiedad_intelectual",
    color_token: "--color-area-ip",
    description_es: "Derechos de autor, patentes",
  },
  {
    slug: "internacional",
    display_es: "Internacional",
    display_en: "International",
    category: "publico",
    color_token: "--color-area-public",
    description_es: "Tratados, derecho internacional privado",
  },
  {
    slug: "ambiental",
    display_es: "Ambiental",
    display_en: "Environmental",
    category: "especializado",
    color_token: "--color-area-specialized",
    description_es: "Medio ambiente, evaluación ambiental",
  },
  {
    slug: "migratorio",
    display_es: "Migratorio",
    display_en: "Immigration",
    category: "especializado",
    color_token: "--color-area-specialized",
    description_es: "Visas, residencias, naturalización",
  },
  {
    slug: "marítimo",
    display_es: "Marítimo",
    display_en: "Maritime",
    category: "especializado",
    color_token: "--color-area-specialized",
    description_es: "Navegación, fletamento",
  },
  {
    slug: "minero",
    display_es: "Minero",
    display_en: "Mining",
    category: "especializado",
    color_token: "--color-area-specialized",
    description_es: "Concesiones mineras, Ley 146",
  },
  {
    slug: "seguros",
    display_es: "Seguros",
    display_en: "Insurance",
    category: "comercial_financiero",
    color_token: "--color-area-financial",
    description_es: "Contratos de seguro, Superintendencia de Seguros",
  },
  {
    slug: "familia",
    display_es: "Familia",
    display_en: "Family",
    category: "civil_familiar",
    color_token: "--color-area-civil",
    description_es: "Divorcio, custodia, alimentos",
  },
  {
    slug: "constitucional",
    display_es: "Constitucional",
    display_en: "Constitutional",
    category: "publico",
    color_token: "--color-area-public",
    description_es: "TC, amparos, derechos fundamentales",
  },
];

const _bySlug = new Map(PRACTICE_AREAS.map((p) => [p.slug, p]));

export function getPracticeArea(slug: string): PracticeArea | undefined {
  return _bySlug.get(slug as PracticeAreaSlug);
}

export function getPracticeAreaDisplay(slug: string, lang: "es" | "en" = "es"): string {
  const area = getPracticeArea(slug);
  if (!area) return slug;
  return lang === "es" ? area.display_es : area.display_en;
}

export const PRACTICE_AREAS_BY_CATEGORY: Record<PracticeAreaCategory, PracticeArea[]> = {
  comercial_financiero: PRACTICE_AREAS.filter((p) => p.category === "comercial_financiero"),
  civil_familiar: PRACTICE_AREAS.filter((p) => p.category === "civil_familiar"),
  publico: PRACTICE_AREAS.filter((p) => p.category === "publico"),
  penal_litigio: PRACTICE_AREAS.filter((p) => p.category === "penal_litigio"),
  trabajo: PRACTICE_AREAS.filter((p) => p.category === "trabajo"),
  propiedad_intelectual: PRACTICE_AREAS.filter((p) => p.category === "propiedad_intelectual"),
  especializado: PRACTICE_AREAS.filter((p) => p.category === "especializado"),
};
