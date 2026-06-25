// lib/legal-cockpit/types.ts
// Tipos estrictos para el Legal OS Cockpit v4.2

export type LegalSystemStatus = {
  agentsCount: number;
  agentsSource: "backend" | "demo";
  ragStatus: "verified" | "degraded" | "unknown";
  auditTrailStatus: "on" | "off" | "unknown";
  jurisdictions: string[];
  demoData: boolean;
  version?: string;
};

export type TrustStatus = "verified" | "pending" | "demo" | "unavailable";

export type TrustItem = {
  key: string;
  label: string;
  status: TrustStatus;
};

export type LegalKPI = {
  key: string;
  label: string;
  value: number | string;
  helper: string;
  severity: "neutral" | "success" | "warning" | "danger";
  demoData: boolean;
};

export type LegalUrgentMatter = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  urgency: "critical" | "warning" | "active" | "blocked";
  summary: string;
  pendingTasks: string[];
  suggestions: Array<{ text: string; actionKey: string }>;
  deadlineDays?: number;
  demoData: boolean;
};

export type LegalAgent = {
  id: string;
  name: string;
  category:
    | "documentos"
    | "litigio"
    | "compliance"
    | "investigacion"
    | "plazos"
    | "bancario"
    | "inmobiliario"
    | "laboral";
  subtitle: string;
  description: string;
  estimatedSavings: string;
  status: "active" | "beta" | "requires_data" | "unavailable";
  inputRequired: string;
  outputExpected: string;
  certificationDate?: string;
  demoData: boolean;
};

export type GoldenPathStep = {
  step: number;
  key: string;
  label: string;
  status: "done" | "active" | "pending" | "blocked";
  action: string;
};

export type FallbackAction = {
  title: string;
  agentId: string;
  prompt: string;
};

// ── CALENDARIO JUDICIAL ──────────────────────────────────
export type CalendarView = "semana" | "mes";

export type EventType = "audiencia" | "plazo" | "prox" | "interno";

export interface CalendarEvent {
  id: string;
  day: number;
  start: number;
  dur: number;
  type: EventType;
  title: string;
  sub: string;
  city?: string;
  countdown?: string;
  conflict?: boolean;
}

export interface DayColumn {
  dow: string;
  num: number;
  today: boolean;
  events: CalendarEvent[];
}

export interface ReminderItem {
  key: string;
  title: string;
  sub: string;
  on: boolean;
}

export interface AudienciaFormState {
  casoId: string;
  resultado: "celebrada" | "aplazada" | "suspendida" | "";
  notas: string;
  programarNext: boolean;
  fecha: string;
  hora: string;
  juzgado: string;
  ciudad: string;
}

export interface KpiCard {
  label: string;
  value: string | number;
  badge: string;
  sub: string;
  accentColor: string;
  sparkPoints: string;
}
