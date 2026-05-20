import { apiFetch } from "@/lib/api/fetch-client";
import type { BankAnalytics, BankAnalyticsPeriod } from "@/types/bank-analytics";

export type BankAnalyticsXRoleHeader = "BANK_ANALYST" | "BANK_ADMIN";

export function isBankAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_BANK_ANALYTICS === "true";
}

/** Header value required by Phase C Agent-4 spec (distinct from TENANT_ADMIN used elsewhere). */
export function resolveBankAnalyticsRoleFromBrowser(): BankAnalyticsXRoleHeader | null {
  if (typeof window === "undefined") return null;

  const envRole = process.env.NEXT_PUBLIC_DEV_BANK_ROLE?.trim().toUpperCase();
  if (envRole === "BANK_ANALYST" || envRole === "BANK_ADMIN") {
    return envRole;
  }

  const raw = (window.localStorage.getItem("nadakki_role") ?? "").trim().toLowerCase();
  if (!raw.length) return "BANK_ANALYST";
  if (raw.includes("dealer")) return null;
  if (
    raw === "admin" ||
    raw === "owner" ||
    raw === "tenant_admin" ||
    raw === "system_admin" ||
    raw.includes("bank_admin")
  ) {
    return "BANK_ADMIN";
  }
  if (raw.includes("tenant")) return "BANK_ADMIN";
  if (raw === "viewer" || raw === "bank_analyst" || raw === "analyst" || raw === "risk") {
    return "BANK_ANALYST";
  }
  return "BANK_ANALYST";
}

export function canAccessBankAnalytics(): boolean {
  return resolveBankAnalyticsRoleFromBrowser() !== null;
}

/** Always mask aggregates shown in analyst-facing dashboards (Phase C RBAC UX). */
export function maskBankAnalyticsText(text: string | undefined): string {
  const s = text?.trim() ?? "";
  if (!s) return "—";
  return (
    s
      // Dominican cédula-style patterns & long digit runs (no individual IDs in UI)
      .replace(/\b\d{3}-\d{7}-\d{1}\b/g, "***-*******-*")
      .replace(/\b\d{11}\b/g, "***********")
      .replace(/\b\d{10,}\b/g, "******")
      // Email
      .replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "***@masked")
      // Generic phone-ish clusters
      .replace(/\b(?:\+\d{1,3}[ .-]?)?(?:\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4})\b/g, "*** *** ****")
      // Common name-bearing connector used in narrative alerts
      .replace(/\bCliente\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,4}\b/gi, "Cliente ***")
      .trim()
  );
}

export async function getBankAnalytics(period: BankAnalyticsPeriod): Promise<BankAnalytics> {
  const role = typeof window !== "undefined" ? resolveBankAnalyticsRoleFromBrowser() : null;
  if (!role) throw new Error("Acceso solo para roles bancarios BANK_ANALYST / BANK_ADMIN.");
  const response = await apiFetch(`/api/v2/analytics/bank/summary?period=${encodeURIComponent(period)}`, {
    method: "GET",
    headers: {
      "X-Role": role,
    },
  });
  if (!response.ok) {
    throw new Error(`Bank analytics fetch failed: ${response.status}`);
  }
  return response.json() as Promise<BankAnalytics>;
}
