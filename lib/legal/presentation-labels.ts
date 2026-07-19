import type { LegalCasesMessages } from "@/hooks/useLegalCasesMessages";

/** Etiquetas de presentación UI — convención i18n_es (es-DO dominio legal). */
export function caseStateLabel(m: LegalCasesMessages, state: string): string {
  return (m.states as Record<string, string>)[state] ?? state.replaceAll("_", " ").toLowerCase();
}

export function actorRoleLabel(m: LegalCasesMessages, role: string): string {
  return (m.wizard.roles as Record<string, string>)[role] ?? role;
}

export function actorKindLabel(m: LegalCasesMessages, kind: string): string {
  return (m.wizard.actor_kind as Record<string, string>)[kind] ?? kind;
}

export function actionDisplayLabel(
  m: LegalCasesMessages,
  action: { action_name: string; display_name?: string | null },
): string {
  const mapped = (m.action_labels as Record<string, string>)[action.action_name];
  if (mapped) return mapped;
  const dn = action.display_name?.trim();
  if (dn && (m.action_labels as Record<string, string>)[dn]) {
    return (m.action_labels as Record<string, string>)[dn]!;
  }
  return dn || action.action_name.replaceAll("_", " ");
}

export function packStatusLabel(m: LegalCasesMessages, status: string | null | undefined): string {
  const key = (status ?? "unknown").toLowerCase();
  return (m.pack_status as Record<string, string>)[key] ?? m.pack_status.unknown;
}

export function auditTrailStatusLabel(m: LegalCasesMessages, status: string): string {
  return (m.audit.status_values as Record<string, string>)[status] ?? status;
}

export function auditTrailRiskLabel(m: LegalCasesMessages, risk: string): string {
  return (m.audit.risk_values as Record<string, string>)[risk] ?? risk;
}
