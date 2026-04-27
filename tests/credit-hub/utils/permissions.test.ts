import { canPerform } from "@/lib/credit-hub/utils/permissions";

describe("canPerform", () => {
  test("dealer can create_application", () => {
    expect(canPerform("dealer", "create_application")).toBe(true);
  });

  test("dealer cannot create_decision", () => {
    expect(canPerform("dealer", "create_decision")).toBe(false);
  });

  test("bank cannot edit_application", () => {
    expect(canPerform("bank", "edit_application")).toBe(false);
  });

  test("bank can create_decision", () => {
    expect(canPerform("bank", "create_decision")).toBe(true);
  });

  test("customer cannot view_internal_notes", () => {
    expect(canPerform("customer", "view_internal_notes")).toBe(false);
  });

  test("customer can accept_offer", () => {
    expect(canPerform("customer", "accept_offer")).toBe(true);
  });

  test("admin can manage_webhooks", () => {
    expect(canPerform("admin", "manage_webhooks")).toBe(true);
  });

  test("admin can view_audit_log", () => {
    expect(canPerform("admin", "view_audit_log")).toBe(true);
  });
});
