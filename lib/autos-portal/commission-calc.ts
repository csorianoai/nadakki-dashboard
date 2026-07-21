/** Read-only commission calculator for financed leads (client-side MVP). */

import { COMMISSION_RATE, type CommissionRow } from "./admin-types";
import type { FinancingLead } from "@/types/autos";

export function calculateCommissionAmount(requestedAmount: number): number {
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) return 0;
  return Math.round(requestedAmount * COMMISSION_RATE * 100) / 100;
}

export function financingLeadToCommissionRow(
  lead: FinancingLead,
  dealerId = "unknown",
): CommissionRow {
  return {
    lead_id: lead.lead_id,
    vehicle_name: lead.vehicle_name,
    dealer_id: dealerId,
    requested_amount: lead.requested_amount,
    commission_amount: calculateCommissionAmount(lead.requested_amount),
    created_at: lead.created_at,
  };
}

export function filterCommissionsByDateRange(
  rows: CommissionRow[],
  startMs: number | null,
  endMs: number | null,
): CommissionRow[] {
  return rows.filter((row) => {
    const t = new Date(row.created_at).getTime();
    if (Number.isNaN(t)) return false;
    if (startMs != null && t < startMs) return false;
    if (endMs != null && t > endMs) return false;
    return true;
  });
}

export function filterCommissionsByDealer(
  rows: CommissionRow[],
  dealerId: string | null,
): CommissionRow[] {
  if (!dealerId) return rows;
  return rows.filter((row) => row.dealer_id === dealerId);
}

export function commissionsToCsv(rows: CommissionRow[]): string {
  const header = "Lead ID,Vehicle,Dealer ID,Requested Amount,Commission,Date";
  const lines = rows.map((c) =>
    [
      c.lead_id,
      `"${c.vehicle_name.replace(/"/g, '""')}"`,
      c.dealer_id,
      c.requested_amount,
      c.commission_amount,
      c.created_at,
    ].join(","),
  );
  return [header, ...lines].join("\n");
}
