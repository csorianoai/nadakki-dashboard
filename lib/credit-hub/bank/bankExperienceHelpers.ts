import type { NoteCategory } from "../api/bankExperienceClient";

export function isBankNotesRole(roleKey: string | null | undefined): boolean {
  const k = (roleKey ?? "").trim().toLowerCase();
  return k === "bank_analyst" || k === "bank_admin" || k === "bank_supervisor";
}

export function isBankSupervisorRole(roleKey: string | null | undefined): boolean {
  const k = (roleKey ?? "").trim().toLowerCase();
  return k === "bank_admin" || k === "bank_supervisor";
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export const NOTE_CATEGORY_META: Record<
  NoteCategory,
  { label: string; bg: string; color: string }
> = {
  GENERAL: { label: "General", bg: "var(--ch-surface-2, #f1f5f9)", color: "var(--ch-text-2, #64748b)" },
  RIESGO: { label: "Riesgo", bg: "var(--ch-warning-soft, #fef9c3)", color: "var(--ch-warning-text, #a16207)" },
  COMPLIANCE: { label: "Compliance", bg: "var(--ch-danger-soft, #fee2e2)", color: "var(--ch-danger-text, #b91c1c)" },
  SEGUIMIENTO: { label: "Seguimiento", bg: "var(--ch-info-soft, #dbeafe)", color: "var(--ch-info-text, #1d4ed8)" },
};

export function noteCategoryMeta(category: string) {
  const key = category.toUpperCase() as NoteCategory;
  return NOTE_CATEGORY_META[key] ?? NOTE_CATEGORY_META.GENERAL;
}
