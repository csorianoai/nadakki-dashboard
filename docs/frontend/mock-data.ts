import type { OffersResponse } from "@/types/credit-offers";

export const MOCK_OFFERS_2_LENDERS: OffersResponse = {
  application_id: "00000000-0000-0000-0000-000000000001",
  tenant_id: "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
  offers: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      application_id: "00000000-0000-0000-0000-000000000001",
      tenant_id: "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
      lender_code: "credicefi",
      amount_approved: 25000.0,
      interest_rate_apr: 15.5,
      term_months: 48,
      monthly_payment: 695.32,
      status: "approved",
      created_at: "2026-05-15T14:23:45.123456+00:00",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      application_id: "00000000-0000-0000-0000-000000000001",
      tenant_id: "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
      lender_code: "pilot",
      amount_approved: 24500.0,
      interest_rate_apr: 14.9,
      term_months: 60,
      monthly_payment: 580.18,
      status: "counter_offer",
      created_at: "2026-05-15T14:23:47.789012+00:00",
    },
  ],
  pagination: { limit: 20, offset: 0, total: 2 },
};
