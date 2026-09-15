/** Dealer lead scoring API — Fase 8 with mock fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { demoDelay } from "@/lib/autos-agent/demo-delay";
import { FEATURE_LEAD_SCORING_BACKEND } from "@/lib/autos-agent/feature-flags";
import { MOCK_DEALER_LEADS, type DealerLead } from "@/lib/dealer/leads-mock";
import { resolveDealerAccessContext } from "@/lib/dealer/access-context";

export type LeadFilters = {
  vehicleId?: number;
  tier?: "hot" | "warm" | "cold" | "all";
  status?: "new" | "contacted" | "closed" | "all";
  search?: string;
};

export type LeadsApiResult = { data: DealerLead[]; fromBackend: boolean };

const contactedKey = "nadakki_leads_contacted";

function applyLocalContacted(leads: DealerLead[]): DealerLead[] {
  if (typeof window === "undefined") return leads;
  try {
    const ids = JSON.parse(window.localStorage.getItem(contactedKey) ?? "[]") as string[];
    return leads.map((l) => (ids.includes(l.id) ? { ...l, status: "contacted" as const } : l));
  } catch {
    return leads;
  }
}

export async function getLeadsPriority(
  dealerId: string,
  filters: LeadFilters = {},
): Promise<LeadsApiResult> {
  if (FEATURE_LEAD_SCORING_BACKEND) {
    try {
      const params = new URLSearchParams({ dealer_id: dealerId });
      if (filters.vehicleId) params.set("vehicle_id", String(filters.vehicleId));
      const res = await autosFetch<{ leads: DealerLead[] }>(
        `/api/v1/autos_ai/dealer_ai/leads/priority?${params}`,
      );
      if (res?.leads) return { data: applyLocalContacted(res.leads), fromBackend: true };
    } catch (error) {
      console.warn("Lead scoring failed, using mock", error);
    }
  }

  await demoDelay();
  let leads = applyLocalContacted([...MOCK_DEALER_LEADS]);

  if (filters.vehicleId) leads = leads.filter((l) => l.vehicleId === filters.vehicleId);
  if (filters.tier && filters.tier !== "all") leads = leads.filter((l) => l.tier === filters.tier);
  if (filters.status && filters.status !== "all")
    leads = leads.filter((l) => l.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (l) => l.name.toLowerCase().includes(q) || l.phone.includes(q),
    );
  }

  return { data: leads.sort((a, b) => b.score - a.score), fromBackend: false };
}

export function markLeadContacted(leadId: string): void {
  if (typeof window === "undefined") return;
  const ids = JSON.parse(window.localStorage.getItem(contactedKey) ?? "[]") as string[];
  if (!ids.includes(leadId)) {
    window.localStorage.setItem(contactedKey, JSON.stringify([...ids, leadId]));
  }
}

export function getDealerId(): string | null {
  const resolved = resolveDealerAccessContext();
  if (resolved.status !== "ready") return null;
  return resolved.context.dealerId;
}
