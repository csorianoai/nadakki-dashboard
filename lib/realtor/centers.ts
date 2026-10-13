import { center as miDia } from "./mi-dia/center";
import { center as clientes } from "./clientes/center";
import { center as propietarios } from "./propietarios/center";
import { center as propiedades } from "./propiedades/center";
import { center as marketingAi } from "./marketing-ai/center";
import { center as operaciones } from "./operaciones/center";
import { center as documentos } from "./documentos/center";
import { center as smartCalendar } from "./smart-calendar/center";
import { center as careerDirector } from "./career-director/center";

/** Centros de la barra lateral, en el grupo y el orden del prototipo DL10A. Solo los que tienen `href` existen hoy. */
export type RealtorCenter = { id: string; label: string; group: string; href?: string };

/** El `href` de cada centro vive en lib/realtor/<centro>/center.ts; aquí solo se compone el orden y los rótulos. */
export const REALTOR_CENTERS: readonly RealtorCenter[] = [
  { ...miDia, label: "Mi día", group: "HOY" },
  { ...clientes, label: "Clientes", group: "CARTERA" },
  { ...propietarios, label: "Propietarios", group: "CARTERA" },
  { ...propiedades, label: "Propiedades", group: "CARTERA" },
  { ...marketingAi, label: "Marketing AI", group: "CRECIMIENTO IA" },
  { id: "demand-radar", label: "Demand Radar", group: "CRECIMIENTO IA", href: "/realtor/demand-radar" },
  { ...operaciones, label: "Operaciones", group: "OPERACIÓN" },
  { ...documentos, label: "Documentos", group: "OPERACIÓN" },
  { id: "finanzas", label: "Finanzas", group: "OPERACIÓN" },
  { id: "crm", label: "CRM", group: "RELACIÓN Y CARRERA" },
  { id: "academia", label: "Academia", group: "RELACIÓN Y CARRERA" },
  { id: "mi-oficina", label: "Mi oficina", group: "RELACIÓN Y CARRERA" },
];

/** Bloques fijos de la barra (no son filas de la lista): Career Director y Smart Calendar. */
export const CAREER_DIRECTOR = careerDirector;
export const SMART_CALENDAR = smartCalendar;

export const SOON = "Próximamente";

/** Todo lo que el armazón muestra como centro, con o sin fila: sirve para derivar qué debe decir «Próximamente». */
export const ALL_CENTERS: readonly { id: string; href?: string }[] = [...REALTOR_CENTERS, CAREER_DIRECTOR, SMART_CALENDAR];

export function filterCenters(query: string): RealtorCenter[] {
  const q = query.trim().toLowerCase();
  return REALTOR_CENTERS.filter((c) => !q || c.label.toLowerCase().includes(q));
}

export function centerForPath(pathname: string | null): string {
  const hit = REALTOR_CENTERS.find((c) => c.href && pathname?.startsWith(c.href));
  return hit ? hit.label : "Inicio";
}
