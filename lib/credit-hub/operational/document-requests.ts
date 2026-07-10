import type { DocumentRequestStatus, DocumentRequestType } from "@/lib/credit-hub/api/operationalClient";

export const DOCUMENT_REQUEST_TYPE_OPTIONS: Array<{ value: DocumentRequestType; label: string }> = [
  { value: "employment_letter", label: "Carta empleo" },
  { value: "pay_stubs", label: "Nóminas" },
  { value: "bank_statements", label: "Estados de cuenta" },
  { value: "tax_return", label: "Impuestos" },
  { value: "address_proof", label: "Comprobante domicilio" },
  { value: "other", label: "Otro" },
];

export function documentRequestTypeLabel(type: string): string {
  return DOCUMENT_REQUEST_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type.replace(/_/g, " ");
}

export function documentRequestStatusMeta(status: string): { label: string; color: string; bg: string } {
  const s = status.toUpperCase();
  if (s === "REQUESTED") return { label: "Solicitado", color: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)" };
  if (s === "UPLOADED") return { label: "Subido por dealer", color: "var(--ch-info-text)", bg: "var(--ch-info-soft)" };
  if (s === "ACCEPTED") return { label: "Aceptado", color: "var(--ch-success-text)", bg: "var(--ch-success-soft)" };
  if (s === "REJECTED") return { label: "Rechazado", color: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)" };
  return { label: status, color: "var(--ch-text-3)", bg: "var(--ch-surface-2)" };
}

export function isDocumentRequestStatus(value: string): value is DocumentRequestStatus {
  return ["REQUESTED", "UPLOADED", "ACCEPTED", "REJECTED"].includes(value.toUpperCase());
}
