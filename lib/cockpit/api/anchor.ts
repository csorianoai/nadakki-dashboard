import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import type { AnchorReconciliationResult } from "@/lib/cockpit/finance-v3/anchor-reconciliation";

export type AnchorFetchResult =
  | { status: "ok"; data: AnchorReconciliationResult }
  | { status: "error"; error: string; statusCode?: number };

export async function fetchFinanceAnchor(): Promise<AnchorFetchResult> {
  try {
    const raw = await platformFetch<AnchorReconciliationResult>(
      "/api/v1/cockpit/finance/reconciliation/anchor",
    );
    return { status: "ok", data: raw };
  } catch (err) {
    if (err instanceof PlatformApiError) {
      return { status: "error", error: err.message, statusCode: err.status };
    }
    return { status: "error", error: err instanceof Error ? err.message : "Error de red" };
  }
}
