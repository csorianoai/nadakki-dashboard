/**
 * Nauta v2 catalog metadata — source: nauta_portal_v2.html EMP array.
 * Fields marked TODO(api) should come from backend when available.
 */
import { ROLE_NAMES, SUPERVISORS } from "./strings";

export type NautaCatalogStatus = "prioridad" | "listo" | "laboratorio" | "concepto";
export type NautaRiskLevelKey = "bajo" | "medio" | "alto" | "critico";
export type NautaExpedienteView = "expediente" | "expediente-e2" | "expediente-e16";

export interface NautaCatalogEntry {
  role_id: string;
  department_id: string;
  /** Catalog lifecycle status for card variant. TODO(api): derive from employees[].status */
  catalog_status: NautaCatalogStatus;
  role_name: string;
  /** TODO(api): employees[].risk_level or role_pack */
  risk_level: NautaRiskLevelKey;
  /** TODO(api): employees[].supervisor_ref resolved to name */
  supervisor: string;
  /** POST /runs may include task_instruction when true (E16). */
  allows_freeform?: boolean;
  /** TODO(api): activity feed / status + activity_ref */
  live_line?: string;
  is_star?: boolean;
  /** Opens expediente on card click */
  expediente?: NautaExpedienteView;
  /** Monthly cost RD$ for expediente/bundle. TODO(api): GET /nauta/plans */
  monthly_cost_dop?: number;
}

/** 16 fichas — distribution D0:1 D1:4 D2:4 D3:3 D4:3 D5:1 */
export const NAUTA_CATALOG: NautaCatalogEntry[] = [
  {
    role_id: "E1",
    department_id: "d1",
    catalog_status: "listo",
    role_name: ROLE_NAMES.E1!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d1!,
    live_line: "Corriendo en laboratorio ahora",
    expediente: "expediente",
    monthly_cost_dop: 14200,
  },
  {
    role_id: "E2",
    department_id: "d1",
    catalog_status: "prioridad",
    role_name: ROLE_NAMES.E2!,
    risk_level: "critico",
    supervisor: SUPERVISORS.d1!,
    live_line: "Rol estrella · en diseño prioritario",
    is_star: true,
    expediente: "expediente-e2",
    monthly_cost_dop: 16800,
  },
  {
    role_id: "E3",
    department_id: "d1",
    catalog_status: "laboratorio",
    role_name: ROLE_NAMES.E3!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d1!,
  },
  {
    role_id: "E4",
    department_id: "d1",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E4!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d1!,
  },
  {
    role_id: "E5",
    department_id: "d2",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E5!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d2!,
  },
  {
    role_id: "E6",
    department_id: "d2",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E6!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d2!,
  },
  {
    role_id: "E7",
    department_id: "d2",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E7!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d2!,
  },
  {
    role_id: "E8",
    department_id: "d2",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E8!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d2!,
  },
  {
    role_id: "E9",
    department_id: "d3",
    catalog_status: "laboratorio",
    role_name: ROLE_NAMES.E9!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d3!,
  },
  {
    role_id: "E10",
    department_id: "d3",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E10!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d3!,
  },
  {
    role_id: "E11",
    department_id: "d3",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E11!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d3!,
  },
  {
    role_id: "E12",
    department_id: "d4",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E12!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d4!,
  },
  {
    role_id: "E13",
    department_id: "d4",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E13!,
    risk_level: "bajo",
    supervisor: SUPERVISORS.d4!,
  },
  {
    role_id: "E14",
    department_id: "d4",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E14!,
    risk_level: "alto",
    supervisor: SUPERVISORS.d4!,
  },
  {
    role_id: "E0",
    department_id: "d0",
    catalog_status: "laboratorio",
    role_name: ROLE_NAMES.E0!,
    risk_level: "bajo",
    supervisor: SUPERVISORS.d0!,
  },
  {
    role_id: "E15",
    department_id: "d5",
    catalog_status: "concepto",
    role_name: ROLE_NAMES.E15!,
    risk_level: "bajo",
    supervisor: SUPERVISORS.d5!,
  },
  {
    role_id: "E16",
    department_id: "d4",
    catalog_status: "listo",
    role_name: ROLE_NAMES.E16!,
    risk_level: "medio",
    supervisor: SUPERVISORS.d4!,
    allows_freeform: true,
    live_line: "Acepta instrucciones en lenguaje natural",
    expediente: "expediente-e16",
    monthly_cost_dop: 12800,
  },
];

export const DEPT_ORDER = ["d0", "d1", "d2", "d3", "d4", "d5"] as const;
export const STATUS_ORDER: NautaCatalogStatus[] = ["prioridad", "listo", "laboratorio", "concepto"];

export const DEPT_COUNTS: Record<string, number> = {
  d0: 1,
  d1: 4,
  d2: 4,
  d3: 3,
  d4: 4,
  d5: 1,
};

export interface NautaBundlePlan {
  department_id: string;
  featured?: boolean;
  price_dop: number;
  /** TODO(api): GET /nauta/plans */
  hours_saved_month: number;
  save_line: string;
  value_anchor: string;
}

export const NAUTA_BUNDLES: NautaBundlePlan[] = [
  {
    department_id: "d1",
    featured: true,
    price_dop: 52000,
    hours_saved_month: 690,
    save_line: "◱ ≈ 690 horas/mes devueltas a su equipo",
    value_anchor:
      "Menos que un solo hallazgo 155-17 de la Superintendencia — se ancla contra la sanción, no contra el salario.",
  },
  {
    department_id: "d4",
    price_dop: 34000,
    hours_saved_month: 410,
    save_line: "◱ ≈ 410 horas/mes devueltas",
    value_anchor: "vs. 1 analista junior: RD$ 35–55K/mes + cargas.",
  },
  {
    department_id: "d3",
    price_dop: 34000,
    hours_saved_month: 380,
    save_line: "◱ ≈ 380 horas/mes devueltas",
    value_anchor: "vs. 1 analista junior: RD$ 35–55K/mes + cargas.",
  },
  {
    department_id: "d2",
    price_dop: 46000,
    hours_saved_month: 520,
    save_line: "◱ ≈ 520 horas/mes devueltas",
    value_anchor: "vs. 1 analista junior: RD$ 35–55K/mes + cargas.",
  },
  {
    department_id: "d0",
    price_dop: 12000,
    hours_saved_month: 0,
    save_line: "◱ disponibilidad 24/7 · aislamiento por tenant",
    value_anchor: "Base transversal que sostiene y audita a los demás empleados.",
  },
  {
    department_id: "d5",
    price_dop: 12000,
    hours_saved_month: 0,
    save_line: "◱ vigilancia continua de marca y conformidad",
    value_anchor: "vs. tercerizar el monitoreo de conformidad publicitaria.",
  },
];

/** TODO(api): GET /nauta/activity?limit=6 */
export interface NautaActivityItem {
  id: string;
  dot: "ok" | "ac" | "sl" | "wn";
  text: string;
  meta: string;
}

export const NAUTA_ACTIVITY_MOCK: NautaActivityItem[] = [
  { id: "1", dot: "ok", text: "E2 · Listas restrictivas completó cribado Ley 155-17 sin coincidencias", meta: "hace 4 s · evidencia sellada" },
  { id: "2", dot: "ac", text: "E1 · KYC validó cédula y prueba de vida en laboratorio", meta: "hace 22 s" },
  { id: "3", dot: "wn", text: "E2 · Listas derivó coincidencia parcial a autorización humana", meta: "hace 1 min · requiere aprobación" },
  { id: "4", dot: "sl", text: "E0 · Auditor de plataforma selló el paquete de evidencia diario", meta: "hace 6 min · SHA-256 · 0x8f3a…c21" },
  { id: "5", dot: "ac", text: "E9 · Monitor procesal detectó nuevo proceso en cartera (prueba piloto)", meta: "hace 12 min" },
  { id: "6", dot: "ok", text: "E1 · KYC cerró expediente en 3.1 s", meta: "hace 15 min" },
];

/** TODO(api): GET /nauta/approvals */
export interface NautaApprovalItem {
  id: string;
  role_id: string;
  task: string;
  sub: string;
  risk: NautaRiskLevelKey;
  employee_label: string;
  employee_sub: string;
  hash: string;
}

export const NAUTA_APPROVALS_MOCK: NautaApprovalItem[] = [
  {
    id: "a1",
    role_id: "E2",
    task: "Autorizar desembolso sobre umbral · SOL-9920",
    sub: "RD$ 2,450,000 · score 690",
    risk: "critico",
    employee_label: "Analista de listas / crédito",
    employee_sub: "E2 · hace 1 min",
    hash: "0x5c1a…f92",
  },
  {
    id: "a2",
    role_id: "E2",
    task: "Coincidencia parcial en lista restrictiva · cliente a validar",
    sub: "similitud 82% · Ley 155-17",
    risk: "critico",
    employee_label: "Analista de listas restrictivas",
    employee_sub: "E2 · hace 14 min",
    hash: "0x9b34…c05",
  },
  {
    id: "a3",
    role_id: "E1",
    task: "Confirmar identidad con domicilio no coincidente · exp. 2024-08805",
    sub: "documento a revisión manual",
    risk: "alto",
    employee_label: "Verificador KYC",
    employee_sub: "E1 · hace 6 min",
    hash: "0x2e77…a10",
  },
  {
    id: "a4",
    role_id: "E14",
    task: "Publicar reporte regulatorio a la Superintendencia",
    sub: "período · septiembre 2026",
    risk: "alto",
    employee_label: "Preparador de reportería",
    employee_sub: "E14 · hace 22 min",
    hash: "0x8f3a…c21",
  },
  {
    id: "a5",
    role_id: "E9",
    task: "Marcar cliente por nuevo proceso judicial · cartera activa",
    sub: "expediente 0294-2026",
    risk: "alto",
    employee_label: "Monitor procesal",
    employee_sub: "E9 · hace 31 min",
    hash: "0x1d04…b1a",
  },
];

export function getCatalogByRoleId(roleId: string): NautaCatalogEntry | undefined {
  return NAUTA_CATALOG.find((e) => e.role_id === roleId);
}

export function catalogForDepartment(deptId: string): NautaCatalogEntry[] {
  return NAUTA_CATALOG.filter((e) => e.department_id === deptId);
}

export function catalogForStatus(status: NautaCatalogStatus): NautaCatalogEntry[] {
  return NAUTA_CATALOG.filter((e) => e.catalog_status === status);
}
