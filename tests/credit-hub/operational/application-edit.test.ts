import { isApplicationEditable } from "@/lib/credit-hub/operational/application-edit";
import { isOperationalEndpointUnavailable } from "@/lib/credit-hub/api/operationalClient";
import { modifiedFieldKeysFromHistory } from "@/lib/credit-hub/api/operationalClient";
import { CHApiError } from "@/lib/credit-hub/api/client";

describe("application-edit", () => {
  test("DRAFT and SENT_TO_BANKS are editable", () => {
    expect(isApplicationEditable("DRAFT")).toBe(true);
    expect(isApplicationEditable("SENT_TO_BANKS")).toBe(true);
    expect(isApplicationEditable("OFFER_SELECTED")).toBe(false);
  });
});

describe("operationalClient helpers", () => {
  test("404 marks endpoint unavailable", () => {
    expect(isOperationalEndpointUnavailable(new CHApiError("nf", 404))).toBe(true);
  });

  test("modifiedFieldKeysFromHistory collects field names", () => {
    const keys = modifiedFieldKeysFromHistory([
      { field: "down_payment", old_value: 1, new_value: 2 },
      { field: "applicant_phone", old_value: "a", new_value: "b" },
    ]);
    expect(keys.has("down_payment")).toBe(true);
    expect(keys.has("applicant_phone")).toBe(true);
  });
});
