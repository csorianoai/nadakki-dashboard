import { center as miDia } from "./mi-dia/center";
import { center as clientes } from "./clientes/center";
import { center as propietarios } from "./propietarios/center";
import { center as propiedades } from "./propiedades/center";
import { center as marketingAi } from "./marketing-ai/center";
import { center as operaciones } from "./operaciones/center";
import { center as documentos } from "./documentos/center";
import { center as smartCalendar } from "./smart-calendar/center";
import { center as careerDirector } from "./career-director/center";
import { center as resultados } from "./resultados/center";

/** Centros de la barra lateral (menú de César, 2026-10-14). Solo los que tienen `href` existen hoy. */
export type RealtorCenter = { id: string; label: string; group: string; href?: string };

/** El `href` de cada centro vive en lib/realtor/<centro>/center.ts; aquí solo se compone el orden y los rótulos. Los sin `href` llevan la marca «Pronto». */
export const REALTOR_CENTERS: readonly RealtorCenter[] = [
  { ...miDia, label: "Mi día", group: "HOY" },
  { ...clientes, label: "Contactos", group: "CLIENTES" },
  { id: "conversaciones", label: "Conversaciones", group: "CLIENTES" },
  { ...propiedades, label: "Propiedades", group: "CLIENTES" },
  { ...operaciones, label: "Operaciones", group: "NEGOCIOS" },
  { ...documentos, label: "Documentos", group: "NEGOCIOS" },
  { ...marketingAi, label: "Marketing", group: "CRECER" },
  { id: "demand-radar", label: "Mercado", group: "CRECER", href: "/realtor/demand-radar" },
  { ...resultados, label: "Resultados", group: "CRECER" },
  { id: "academia", label: "Academia", group: "CRECER" },
];

/** Centros con ruta viva que ya no son fila de la barra: se llegan desde Contactos. Sirven a la miga y al registro. */
export const OFF_BAR_CENTERS: readonly RealtorCenter[] = [{ ...propietarios, label: "Propietarios", group: "CLIENTES" }];

/** Bloques fijos de la barra (no son filas de la lista): Career Director y Smart Calendar. */
export const CAREER_DIRECTOR = careerDirector;
export const SMART_CALENDAR = smartCalendar;

export const SOON = "Próximamente";
/** Marca discreta de los centros aún sin construir. */
export const SOON_MARK = "Pronto";

/** Todo lo que el armazón muestra como centro, con o sin fila: sirve para derivar qué debe decir «Próximamente». */
export const ALL_CENTERS: readonly { id: string; href?: string }[] = [...REALTOR_CENTERS, ...OFF_BAR_CENTERS, CAREER_DIRECTOR, SMART_CALENDAR];

export function filterCenters(query: string): RealtorCenter[] {
  const q = query.trim().toLowerCase();
  return REALTOR_CENTERS.filter((c) => !q || c.label.toLowerCase().includes(q));
}

export function centerForPath(pathname: string | null): string {
  const hit = [...REALTOR_CENTERS, ...OFF_BAR_CENTERS].find((c) => c.href && pathname?.startsWith(c.href));
  return hit ? hit.label : "Inicio";
}
