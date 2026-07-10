import { buildRequestsQuery } from "@/lib/cockpit/api/creditHub";

describe("credit queue querystring", () => {
  test("composes network scope query", () => {
    const qs = buildRequestsQuery({ scope: "network", page: 2, page_size: 10, state: "PENDING" });
    expect(qs).toContain("scope=network");
    expect(qs).toContain("page=2");
    expect(qs).toContain("page_size=10");
    expect(qs).toContain("state=PENDING");
  });

  test("composes tenant filter query", () => {
    const qs = buildRequestsQuery({
      scope: "tenant",
      tenant_id: "credicefi",
      dealer_id: "d-1",
      date_from: "2026-01-01",
      date_to: "2026-07-01",
    });
    expect(qs).toContain("tenant_id=credicefi");
    expect(qs).toContain("dealer_id=d-1");
    expect(qs).toContain("date_from=2026-01-01");
  });
});
