import {
  DEALER_ADMIN_SLUG_REGEX,
  RESERVED_DEALER_ADMIN_HOSTS,
  resolveDealerAdminHost,
} from "@/lib/dealer-management/admin-host";

describe("resolveDealerAdminHost", () => {
  it.each([
    ["mapaal.nadakki.com", "mapaal"],
    ["27motors.nadakki.com", "27motors"],
    ["dealer-27.nadakki.com", "dealer-27"],
  ])("resolves %s as a dealer tenant", (hostname, tenantSlug) => {
    expect(resolveDealerAdminHost(hostname)).toEqual({ mode: "dealer_subdomain", tenantSlug });
  });

  it("keeps dashboard.nadakki.com as the universal host", () => {
    expect(resolveDealerAdminHost("dashboard.nadakki.com")).toEqual({ mode: "universal" });
  });

  it.each([
    "-mapaal.nadakki.com",
    "mapaal-.nadakki.com",
    "xn--mapaal.nadakki.com",
    "a.b.nadakki.com",
    ".nadakki.com",
    "nadakki.com",
    "example.com",
  ])("rejects invalid or non-dealer hostname %s", (hostname) => {
    expect(resolveDealerAdminHost(hostname)).toEqual({ mode: "unknown" });
  });

  it.each(Array.from(RESERVED_DEALER_ADMIN_HOSTS))(
    "never treats reserved technical host %s as a dealer",
    (slug) => {
      const expected = slug === "dashboard" ? "universal" : "unknown";
      expect(resolveDealerAdminHost(`${slug}.nadakki.com`).mode).toBe(expected);
    },
  );

  it("uses the exact administrative tenant slug contract", () => {
    expect(DEALER_ADMIN_SLUG_REGEX.source).toBe("^[a-z0-9]([a-z0-9-]*[a-z0-9])?$");
  });
});
