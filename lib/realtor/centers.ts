/** Centros de la barra lateral, en el grupo y el orden del prototipo DL10A. Solo los que tienen `href` existen hoy. */
export type RealtorCenter = { id: string; label: string; group: string; href?: string };

export const REALTOR_CENTERS: readonly RealtorCenter[] = [
  { id: "mi-dia", label: "Mi día", group: "HOY" },
  { id: "clientes", label: "Clientes", group: "CARTERA" },
  { id: "propietarios", label: "Propietarios", group: "CARTERA" },
  { id: "propiedades", label: "Propiedades", group: "CARTERA" },
  { id: "marketing-ai", label: "Marketing AI", group: "CRECIMIENTO IA" },
  { id: "demand-radar", label: "Demand Radar", group: "CRECIMIENTO IA", href: "/realtor/demand-radar" },
  { id: "operaciones", label: "Operaciones", group: "OPERACIÓN" },
  { id: "documentos", label: "Documentos", group: "OPERACIÓN" },
  { id: "finanzas", label: "Finanzas", group: "OPERACIÓN" },
  { id: "crm", label: "CRM", group: "RELACIÓN Y CARRERA" },
  { id: "academia", label: "Academia", group: "RELACIÓN Y CARRERA" },
  { id: "mi-oficina", label: "Mi oficina", group: "RELACIÓN Y CARRERA" },
];

export const SOON = "Próximamente";

export function filterCenters(query: string): RealtorCenter[] {
  const q = query.trim().toLowerCase();
  return REALTOR_CENTERS.filter((c) => !q || c.label.toLowerCase().includes(q));
}

export function centerForPath(pathname: string | null): string {
  const hit = REALTOR_CENTERS.find((c) => c.href && pathname?.startsWith(c.href));
  return hit ? hit.label : "Inicio";
}
