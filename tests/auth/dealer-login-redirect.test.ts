/** @jest-environment jsdom */

import { resolveDealerManagementRedirect } from "@/lib/dealer-management/redirect";

describe("dealer management login redirect", () => {
  test("dealer landing enters Dealer Management", () => {
    expect(resolveDealerManagementRedirect("/credit-hub/dealer")).toBe("/autos/dealer");
  });

  test("bank and platform destinations are preserved", () => {
    expect(resolveDealerManagementRedirect("/credit-hub/bank")).toBe("/credit-hub/bank");
    expect(resolveDealerManagementRedirect("/cockpit")).toBe("/cockpit");
    expect(resolveDealerManagementRedirect("/")).toBe("/");
  });
});
