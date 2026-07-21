"use client";

import { apiFetch } from "@/lib/api/fetch-client";
import type {
  Vehicle,
  VehicleCreatePayload,
  VehicleSearchFilters,
  VehicleSearchResult,
  SearchFacets,
  VinDecodeResult,
  Lead,
  LeadCreatePayload,
  LeadTransitionResult,
  FinancingLead,
  FinancingLeadCreatePayload,
  FinanceCalculatePayload,
  FinanceCalculateResult,
  FinanceInversePayload,
  FinanceInverseResult,
  AmortizationResult,
  EntitlementDecision,
  PlanInfo,
} from "@/types/autos";

const BASE = "/api/v1/autos";

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function createVehicle(
  tenantId: string,
  dealerId: string,
  payload: VehicleCreatePayload,
): Promise<Vehicle> {
  const res = await apiFetch(
    `${BASE}/tenants/${tenantId}/dealers/${dealerId}/vehicles`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  if (!res.ok) throw new Error(`create_vehicle failed: ${res.status}`);
  return res.json();
}

export async function getVehicle(vehicleId: string): Promise<Vehicle> {
  const res = await apiFetch(`${BASE}/vehicles/${vehicleId}`);
  if (!res.ok) throw new Error(`get_vehicle failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchVehicles(
  filters: VehicleSearchFilters,
): Promise<VehicleSearchResult> {
  const res = await apiFetch(`${BASE}/vehicles/search`, {
    method: "POST",
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error(`search_vehicles failed: ${res.status}`);
  return res.json();
}

export async function getSearchFacets(
  query?: string,
  facetNames?: string[],
): Promise<SearchFacets> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (facetNames?.length) params.set("facets", facetNames.join(","));
  const qs = params.toString();
  const res = await apiFetch(
    `${BASE}/vehicles/search/facets${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error(`get_facets failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// VIN Decode
// ---------------------------------------------------------------------------

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const res = await apiFetch(`${BASE}/vin/${encodeURIComponent(vin)}/decode`);
  if (!res.ok) throw new Error(`decode_vin failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLead(
  tenantId: string,
  dealerId: string,
  payload: LeadCreatePayload,
): Promise<Lead> {
  const res = await apiFetch(
    `${BASE}/tenants/${tenantId}/dealers/${dealerId}/leads`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  if (!res.ok) throw new Error(`create_lead failed: ${res.status}`);
  return res.json();
}

export async function listLeads(
  tenantId: string,
  dealerId: string,
  opts?: { status?: string; page?: number; page_size?: number },
): Promise<{ leads: Lead[]; total: number; page: number; has_next: boolean }> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.page_size) params.set("page_size", String(opts.page_size));
  const qs = params.toString();
  const res = await apiFetch(
    `${BASE}/tenants/${tenantId}/dealers/${dealerId}/leads${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error(`list_leads failed: ${res.status}`);
  return res.json();
}

export async function transitionLead(
  tenantId: string,
  leadId: string,
  newStatus: string,
  actor?: string,
  note?: string,
): Promise<LeadTransitionResult> {
  const res = await apiFetch(
    `${BASE}/tenants/${tenantId}/leads/${leadId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ new_status: newStatus, actor, note }),
    },
  );
  if (!res.ok) throw new Error(`transition_lead failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Consumer financing leads (mis-leads)
// ---------------------------------------------------------------------------

const FINANCING_LEADS_BASE = "/api/v1/autos/leads";

export async function createFinancingLead(
  payload: FinancingLeadCreatePayload,
): Promise<FinancingLead> {
  const res = await apiFetch(FINANCING_LEADS_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`create_financing_lead failed: ${res.status}`);
  return res.json();
}

export async function listFinancingLeads(): Promise<FinancingLead[]> {
  const res = await apiFetch(FINANCING_LEADS_BASE);
  if (!res.ok) throw new Error(`list_financing_leads failed: ${res.status}`);
  return res.json();
}

export async function getFinancingLead(leadId: string): Promise<FinancingLead> {
  const res = await apiFetch(`${FINANCING_LEADS_BASE}/${encodeURIComponent(leadId)}`);
  if (!res.ok) throw new Error(`get_financing_lead failed: ${res.status}`);
  return res.json();
}

export async function updateFinancingLeadStatus(
  leadId: string,
  status: FinancingLead["status"],
  details?: Record<string, unknown>,
): Promise<FinancingLead> {
  const res = await apiFetch(
    `${FINANCING_LEADS_BASE}/${encodeURIComponent(leadId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, details }),
    },
  );
  if (!res.ok) throw new Error(`update_financing_lead_status failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export async function calculatePayment(
  payload: FinanceCalculatePayload,
): Promise<FinanceCalculateResult> {
  const res = await apiFetch(`${BASE}/finance/calculate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`calculate_payment failed: ${res.status}`);
  return res.json();
}

export async function calculateMaxPrice(
  payload: FinanceInversePayload,
): Promise<FinanceInverseResult> {
  const res = await apiFetch(`${BASE}/finance/inverse`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`calculate_max_price failed: ${res.status}`);
  return res.json();
}

export async function getAmortization(
  payload: FinanceCalculatePayload,
): Promise<AmortizationResult> {
  const res = await apiFetch(`${BASE}/finance/amortization`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`get_amortization failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Entitlements
// ---------------------------------------------------------------------------

export async function checkEntitlement(
  tenantId: string,
  dealerId: string,
  capability: string,
  quantity?: number,
): Promise<EntitlementDecision> {
  const params = quantity ? `?quantity=${quantity}` : "";
  const res = await apiFetch(
    `${BASE}/tenants/${tenantId}/dealers/${dealerId}/entitlements/${capability}${params}`,
  );
  if (!res.ok) throw new Error(`check_entitlement failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export async function listPlans(): Promise<{ plans: PlanInfo[] }> {
  const res = await apiFetch(`${BASE}/billing/plans`);
  if (!res.ok) throw new Error(`list_plans failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Hostname Resolution
// ---------------------------------------------------------------------------

export async function resolveHostname(
  hostname: string,
): Promise<{ tenant_id: string; hostname: string }> {
  const res = await apiFetch(
    `${BASE}/resolve/${encodeURIComponent(hostname)}`,
  );
  if (!res.ok) throw new Error(`resolve_hostname failed: ${res.status}`);
  return res.json();
}
