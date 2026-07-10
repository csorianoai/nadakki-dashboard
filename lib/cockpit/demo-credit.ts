import type { CreditDashboardResponse, CreditRequestFilters, CreditRequestsResponse, CreditAmlResponse, CreditDealerRankingResponse, CreditAuditResponse } from "./types-credit";

export function demoCreditDashboard(): CreditDashboardResponse {
  return {
    data_source: "none",
    kpis: [
      { key: "total", label: "Solicitudes", value: 842 },
      { key: "pending", label: "Pendientes", value: 56 },
      { key: "approved", label: "Aprobadas", value: 412 },
      { key: "approval_rate", label: "Tasa aprobación", value: 64, unit: "%" },
      { key: "avg_amount", label: "Monto prom.", value: 1250000, unit: "DOP" },
      { key: "dealers", label: "Dealers activos", value: 18 },
      { key: "banks", label: "Bancos activos", value: 4 },
      { key: "alerts", label: "Alertas AML", value: 2 },
      { key: "sla", label: "SLA cumplido", value: 94, unit: "%" },
    ],
    weekly_trend: [
      { week: "S1", count: 40 },
      { week: "S2", count: 52 },
      { week: "S3", count: 48 },
      { week: "S4", count: 61 },
    ],
    status_distribution: [
      { state: "PENDING", count: 56 },
      { state: "APPROVED", count: 412 },
      { state: "REJECTED", count: 120 },
    ],
    monthly_amounts: [
      { month: "Ene", amount: 12_000_000 },
      { month: "Feb", amount: 15_500_000 },
      { month: "Mar", amount: 14_200_000 },
    ],
  };
}

export function demoCreditRequests(_filters: CreditRequestFilters): CreditRequestsResponse {
  return {
    data_source: "none",
    items: [
      {
        application_id: "demo-app-001",
        tenant_name: "Ejemplo",
        dealer_name: "Dealer demo",
        applicant_name: "Solicitante demo",
        state: "PENDING",
        requested_amount: 850_000,
        created_at: new Date().toISOString(),
      },
    ],
    total: 1,
    page: 1,
    page_size: 10,
  };
}

export function demoAmlPanel(): CreditAmlResponse {
  return { data_source: "none", matches_today: 1, screenings_today: 24, open_reviews: 2 };
}

export function demoDealerRanking(): CreditDealerRankingResponse {
  return {
    data_source: "none",
    dealers: [{ dealer_name: "Dealer demo", volume: 42, approval_rate: 0.68 }],
  };
}

export function demoCreditAudit(): CreditAuditResponse {
  return {
    data_source: "none",
    events: [{ id: "e1", action: "APPLICATION_CREATED", actor: "dealer", at: new Date().toISOString(), application_id: "demo-app-001" }],
  };
}
