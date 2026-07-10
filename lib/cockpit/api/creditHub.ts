import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import { demoCreditDashboard, demoCreditRequests, demoAmlPanel, demoDealerRanking, demoCreditAudit } from "../demo-credit";
import type {
  CreditDashboardResponse,
  CreditRequestsResponse,
  CreditAmlResponse,
  CreditDealerRankingResponse,
  CreditAuditResponse,
  CreditRequestFilters,
} from "../types-credit";

async function fetchOrDemo<T extends { data_source?: string }>(
  path: string,
  demo: () => T,
): Promise<{ data: T; isDemo: boolean; error: string | null }> {
  try {
    const data = await platformFetch<T>(path);
    return { data, isDemo: data.data_source === "none", error: null };
  } catch (err) {
    if (err instanceof PlatformApiError && (err.status === 404 || err.status === 501)) {
      const data = demo();
      return { data, isDemo: true, error: `Endpoint no disponible (${err.status})` };
    }
    throw err;
  }
}

export function buildRequestsQuery(filters: CreditRequestFilters): string {
  const q = new URLSearchParams();
  q.set("scope", filters.scope ?? "network");
  if (filters.tenant_id) q.set("tenant_id", filters.tenant_id);
  if (filters.state) q.set("state", filters.state);
  if (filters.dealer_id) q.set("dealer_id", filters.dealer_id);
  if (filters.date_from) q.set("date_from", filters.date_from);
  if (filters.date_to) q.set("date_to", filters.date_to);
  if (filters.page != null) q.set("page", String(filters.page));
  if (filters.page_size != null) q.set("page_size", String(filters.page_size));
  return q.toString();
}

export function fetchCreditDashboard() {
  return fetchOrDemo<CreditDashboardResponse>("/api/v1/cockpit/credit/summary", demoCreditDashboard);
}

export function fetchCreditRequests(filters: CreditRequestFilters) {
  const qs = buildRequestsQuery(filters);
  return fetchOrDemo<CreditRequestsResponse>(`/api/v1/cockpit/credit/pipeline?${qs}`, () => demoCreditRequests(filters));
}

export function fetchCreditAml(period = "today") {
  return fetchOrDemo<CreditAmlResponse>(`/api/v1/cockpit/credit/compliance/aml?period=${encodeURIComponent(period)}`, demoAmlPanel);
}

export function fetchDealerRanking(limit = 5) {
  return fetchOrDemo<CreditDealerRankingResponse>(`/api/v1/cockpit/credit/by-tenant?limit=${limit}`, demoDealerRanking);
}

export function fetchCreditAudit(limit = 10) {
  return fetchOrDemo<CreditAuditResponse>(`/api/v1/cockpit/credit/recent?n=${limit}`, demoCreditAudit);
}
