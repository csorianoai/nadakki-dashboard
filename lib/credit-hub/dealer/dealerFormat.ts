import type { CreditApplication, CreditEvent } from "@/lib/credit-hub/types/creditCore";
import type { DealerNotificationItem } from "@/lib/credit-hub/types/dealer-views";
import { chMoneyExact } from "@/lib/credit-hub/ch-base";

export const DEALER_NAV_ROUTES: Record<string, string> = {
  inicio: "/credit-hub/dealer",
  solicitudes: "/credit-hub/dealer/applications",
  nueva: "/credit-hub/dealer/applications/new/applicant",
  preaprobacion: "/credit-hub/dealer/preapproval",
  notificaciones: "/credit-hub/dealer/notifications",
  perfil: "/credit-hub/dealer/profile",
};

/** Explicit marker for a fresh wizard; drafts resume through an application_id instead. */
export const DEALER_NEW_APPLICATION_QUERY = "new=1";

export function dealerNewApplicationHref(): string {
  return `/credit-hub/dealer/applications/new/applicant?${DEALER_NEW_APPLICATION_QUERY}`;
}

export function pathnameToDealerNavId(pathname: string): string {
  if (pathname.includes("/dealer/applications/new")) return "nueva";
  if (pathname.includes("/dealer/applications")) return "solicitudes";
  if (pathname.includes("/dealer/preapproval")) return "preaprobacion";
  if (pathname.includes("/dealer/notifications")) return "notificaciones";
  if (pathname.includes("/dealer/profile")) return "perfil";
  return "inicio";
}

export function dealerTrailForPath(pathname: string): string[] {
  if (pathname.includes("/applications/new")) return ["Credit Hub", "Dealer", "Nueva solicitud"];
  if (pathname.includes("/applications/") && !pathname.endsWith("/applications")) {
    return ["Credit Hub", "Dealer", "Detalle"];
  }
  if (pathname.includes("/applications")) return ["Credit Hub", "Dealer", "Solicitudes"];
  if (pathname.includes("/preapproval")) return ["Credit Hub", "Dealer", "Preaprobación"];
  if (pathname.includes("/notifications")) return ["Credit Hub", "Dealer", "Notificaciones"];
  if (pathname.includes("/profile")) return ["Credit Hub", "Dealer", "Perfil"];
  return ["Credit Hub", "Dealer", "Inicio"];
}

export function defaultDocumentTypeForCountry(
  countryCode: string | undefined,
  primaryId?: string,
): string {
  const map: Record<string, string> = {
    DO: "CEDULA",
    MX: "INE",
    CO: "CEDULA",
  };
  const code = countryCode?.trim().toUpperCase() ?? "";
  return map[code] ?? primaryId ?? "CEDULA";
}

export function chRelTimeDealer(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const m = Math.round((now.getTime() - d.getTime()) / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export function dealerGreeting(locale: string): string {
  const h = new Date().getHours();
  if (locale.toLowerCase().startsWith("es")) {
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  }
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function parseRequestedAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function dealerCurrencyPrefix(currencyCode: string | null | undefined): string {
  const code = currencyCode?.trim().toUpperCase();
  if (!code || code === "DOP") return "RD$";
  if (code === "MXN") return "MX$";
  return `${code} `;
}

/** Formats dealer-facing amounts; null/undefined/zero → em dash. */
export function formatDealerMoney(
  amount: string | number | null | undefined,
  currencyCode: string | null | undefined,
): string {
  if (amount == null || amount === "") return "—";
  const n = parseRequestedAmount(amount);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return chMoneyExact(n, dealerCurrencyPrefix(currencyCode));
}

const READ_KEY = "nadakki_dealer_notifications_read_v1";

export function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function markNotificationRead(id: string): void {
  if (typeof window === "undefined") return;
  const set = getReadNotificationIds();
  set.add(id);
  sessionStorage.setItem(READ_KEY, JSON.stringify([...set]));
}

/** @deprecated Synthetic notifications — do not use in production UI (FE-MOCK-01). */
export function notificationsFromApplications(apps: CreditApplication[]): DealerNotificationItem[] {
  const read = getReadNotificationIds();
  return apps
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 40)
    .map((app) => {
      const isDecision = ["approved", "rejected", "declined", "offered", "counter_offer"].includes(app.status);
      const id = `n-${app.application_id}-${app.updated_at}`;
      return {
        id,
        applicationId: app.application_id,
        title: isDecision ? `Decisión: ${app.applicant_name || app.application_id}` : `Actualización: ${app.applicant_name || app.application_id}`,
        body: isDecision
          ? `Estado ${app.status}${app.decision ? ` · ${app.decision}` : ""}`
          : `Solicitud en estado ${app.status}`,
        category: isDecision ? "decision" : app.status === "processing" ? "system" : "update",
        createdAt: app.updated_at,
        read: read.has(id),
      } satisfies DealerNotificationItem;
    });
}

export function eventsToTimeline(events: CreditEvent[]): Array<{ at: string; label: string; description?: string | null }> {
  return events.map((e) => ({
    at: e.created_at,
    label: e.title || e.type || e.description || "Evento",
    description: e.description,
  }));
}

export const DEALER_MOBILE_NAV_IDS = ["inicio", "solicitudes", "nueva", "notificaciones", "perfil"] as const;

export function dealerDetailHref(applicationId: string): string {
  return `/credit-hub/dealer/applications/${encodeURIComponent(applicationId.trim())}`;
}

export function isActivePipelineStatus(status: string): boolean {
  return !["draft", "rejected", "declined", "cancelled", "processed", "completed"].includes(
    status.toLowerCase(),
  );
}

export function volumeThisMonth(applications: CreditApplication[], currency: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let sum = 0;
  for (const app of applications) {
    const d = new Date(app.created_at);
    if (d.getFullYear() === y && d.getMonth() === m) {
      sum += parseRequestedAmount(app.requested_amount);
    }
  }
  return chMoneyExact(sum, dealerCurrencyPrefix(currency));
}
