import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";
import { formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Short folio for empty-state copy — never the full 36-char UUID as hero text. */
export function shortFolio(applicationId: string): string {
  const id = applicationId.trim();
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `…${id.slice(-8)}`;
}

function isMissingName(name: string | null | undefined, applicationId: string): boolean {
  const n = (name ?? "").trim();
  if (!n || n === "—") return true;
  if (n === applicationId) return true;
  if (UUID_RE.test(n)) return true;
  return false;
}

export interface HumanizedApplicant {
  primaryLabel: string;
  secondaryLabel: string;
  vehicleLabel: string;
  amountLabel: string;
  hasClientData: boolean;
}

/**
 * Renders applicant/vehicle/amount for dealer UI. Never surfaces a raw UUID as the primary label.
 */
export function humanizeApplicant(
  app: Pick<
    CreditApplication,
    | "application_id"
    | "applicant_name"
    | "vehicle_make"
    | "vehicle_model"
    | "vehicle_year"
    | "requested_amount"
  >,
  currency: string,
): HumanizedApplicant {
  const folio = shortFolio(app.application_id);
  const hasClientData = !isMissingName(app.applicant_name, app.application_id);

  const primaryLabel = hasClientData
    ? app.applicant_name.trim()
    : `Sin datos de cliente · folio ${folio}`;

  const secondaryLabel = hasClientData ? `Folio ${folio}` : "Completa el expediente en la solicitud";

  const vehicleParts = [app.vehicle_year, app.vehicle_make, app.vehicle_model].filter(
    (x) => x != null && String(x).trim() !== "",
  );
  const vehicleLabel =
    vehicleParts.length > 0 ? vehicleParts.join(" ") : "Vehículo sin registrar";

  const amountLabel = formatDealerMoney(app.requested_amount, currency);

  return {
    primaryLabel,
    secondaryLabel,
    vehicleLabel,
    amountLabel,
    hasClientData,
  };
}
