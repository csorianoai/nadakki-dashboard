import { isSecurityEndpointUnavailable } from "@/lib/credit-hub/api/securityClient";
import { CHApiError } from "@/lib/credit-hub/api/client";

describe("securityClient helpers", () => {
  test("isSecurityEndpointUnavailable detects 404", () => {
    expect(isSecurityEndpointUnavailable(new CHApiError("not found", 404))).toBe(true);
    expect(isSecurityEndpointUnavailable(new CHApiError("err", 500))).toBe(false);
  });
});
