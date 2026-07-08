import type { CHActorRole } from "../api/client";

export type CHAction =
  | "view_application"
  | "create_application"
  | "edit_application"
  | "route_to_lenders"
  | "view_internal_notes"
  | "create_decision"
  | "edit_decision"
  | "create_offer"
  | "accept_offer"
  | "reject_offer"
  | "confirm_funding"
  | "manage_lenders"
  | "manage_webhooks"
  | "view_audit_log"
  | "view_admin_health";

const MATRIX: Record<CHActorRole, CHAction[] | ["*"]> = {
  dealer: [
    "view_application",
    "create_application",
    "edit_application",
    "route_to_lenders",
    "reject_offer",
    "accept_offer",
  ],
  bank: [
    "view_application",
    "view_internal_notes",
    "create_decision",
    "edit_decision",
    "create_offer",
    "confirm_funding",
  ],
  bank_analyst: [
    "view_application",
    "view_internal_notes",
    "create_decision",
    "edit_decision",
    "create_offer",
  ],
  bank_admin: [
    "view_application",
    "view_internal_notes",
    "create_decision",
    "edit_decision",
    "create_offer",
    "confirm_funding",
    "view_audit_log",
  ],
  compliance_officer: ["view_application", "view_internal_notes", "view_audit_log"],
  customer: ["view_application", "accept_offer", "reject_offer"],
  admin: ["*"],
};

export function canPerform(actor: CHActorRole, action: CHAction): boolean {
  const allowed = MATRIX[actor];
  if (!allowed) return false;
  return allowed[0] === "*" || (allowed as CHAction[]).includes(action);
}
