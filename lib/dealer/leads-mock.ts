/** Lead scoring types & mock data — Fase 8. */

import { VEHICLES_SEED } from "@/lib/vehicles";

export type LeadTier = "hot" | "warm" | "cold";

export type LeadSignal = {
  id: string;
  icon: string;
  label: string;
  explanation: string;
};

export type LeadInteraction = {
  id: string;
  action: string;
  at: string;
};

export type DealerLead = {
  id: string;
  name: string;
  phone: string;
  score: number;
  tier: LeadTier;
  vehicleId: number;
  vehicleName: string;
  signals: LeadSignal[];
  lastActivity: string;
  status: "new" | "contacted" | "closed";
  interactions: LeadInteraction[];
  aiSuggestion?: string;
  otherVehicleIds?: number[];
};

export function tierFromScore(score: number): LeadTier {
  if (score >= 90) return "hot";
  if (score >= 60) return "warm";
  return "cold";
}

export const MOCK_DEALER_LEADS: DealerLead[] = [
  {
    id: "lead-1",
    name: "María Fernández",
    phone: "+1 809-555-0142",
    score: 94,
    tier: "hot",
    vehicleId: 2,
    vehicleName: "2021 Toyota RAV4",
    signals: [
      { id: "s1", icon: "✓", label: "Pre-aprobada Credicefi RD$ 1.5M", explanation: "Aprobación activa hace 3 días" },
      { id: "s2", icon: "👀", label: "Visitó 5 veces esta semana", explanation: "Alta intención de compra" },
      { id: "s3", icon: "❤️", label: "Guardó en favoritos", explanation: "Desde el martes" },
      { id: "s4", icon: "💬", label: "3 mensajes al chat", explanation: "Preguntó por trade-in y cuota" },
    ],
    lastActivity: "Hace 2 horas",
    status: "new",
    interactions: [
      { id: "i1", action: "Vio VDP", at: "2026-07-16T14:00:00Z" },
      { id: "i2", action: "Usó calculadora de cuota", at: "2026-07-16T14:05:00Z" },
      { id: "i3", action: "Chat AI — preguntó disponibilidad", at: "2026-07-17T10:00:00Z" },
    ],
    aiSuggestion: "Este lead prefiere SUVs. También le mostramos: Kia Sportage, Hyundai Tucson, Honda CR-V.",
    otherVehicleIds: [4, 7, 9],
  },
  {
    id: "lead-2",
    name: "Carlos Méndez",
    phone: "+1 809-555-0198",
    score: 88,
    tier: "warm",
    vehicleId: 1,
    vehicleName: "2022 Toyota Corolla",
    signals: [
      { id: "s5", icon: "🧮", label: "Usó calculadora de cuota", explanation: "Simuló 60 meses" },
      { id: "s6", icon: "💬", label: "2 mensajes al chat", explanation: "Preguntó historial DGII" },
    ],
    lastActivity: "Hace 5 horas",
    status: "new",
    interactions: [{ id: "i4", action: "Chat AI", at: "2026-07-17T07:00:00Z" }],
    otherVehicleIds: [3, 5],
  },
  {
    id: "lead-3",
    name: "Ana Rodríguez",
    phone: "+1 829-555-0234",
    score: 72,
    tier: "warm",
    vehicleId: 6,
    vehicleName: "2020 Honda CR-V",
    signals: [{ id: "s7", icon: "👀", label: "Visitó 3 veces", explanation: "Esta semana" }],
    lastActivity: "Ayer",
    status: "contacted",
    interactions: [],
  },
  {
    id: "lead-4",
    name: "Pedro Santos",
    phone: "+1 809-555-0311",
    score: 45,
    tier: "cold",
    vehicleId: 8,
    vehicleName: "2019 Nissan Sentra",
    signals: [{ id: "s8", icon: "👀", label: "1 visita", explanation: "Hace 10 días" }],
    lastActivity: "Hace 3 días",
    status: "new",
    interactions: [],
  },
];

export function getLeadStats(leads: DealerLead[]) {
  return {
    hot: leads.filter((l) => l.tier === "hot").length,
    warm: leads.filter((l) => l.tier === "warm").length,
    cold: leads.filter((l) => l.tier === "cold").length,
    total: leads.length,
  };
}

export function getVehicleThumb(vehicleId: number) {
  return VEHICLES_SEED.find((v) => v.id === vehicleId);
}
