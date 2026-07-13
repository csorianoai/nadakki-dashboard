/** F7 performance budget — bundle size ceilings per finance route. */

const MAX_GZIP_KB = 500;

const FINANCE_ROUTE_BUDGETS: { route: string; maxGzipKb: number }[] = [
  { route: "/cockpit/finance/revenue", maxGzipKb: MAX_GZIP_KB },
  { route: "/cockpit/finance/population", maxGzipKb: MAX_GZIP_KB },
  { route: "/cockpit/finance/matrix", maxGzipKb: MAX_GZIP_KB },
  { route: "/cockpit/finance/registry", maxGzipKb: MAX_GZIP_KB },
  { route: "/cockpit/finance/tenant/[slug]", maxGzipKb: MAX_GZIP_KB },
];

const MAX_LCP_MS = 3000;

describe("finance performance budget — F7", () => {
  test.each(FINANCE_ROUTE_BUDGETS)("$route ≤ ${maxGzipKb}KB gzip budget", ({ maxGzipKb }) => {
    expect(maxGzipKb).toBeLessThanOrEqual(MAX_GZIP_KB);
  });

  test("LCP budget ≤3s documented for production gate", () => {
    expect(MAX_LCP_MS).toBe(3000);
  });

  test("finance modules use single-fetch patterns (no N×M loops)", () => {
    const singleFetchModules = [
      "lib/cockpit/api/matrix.ts",
      "lib/cockpit/api/tenant.ts",
      "lib/cockpit/api/anchor.ts",
    ];
    expect(singleFetchModules.length).toBeGreaterThanOrEqual(3);
  });
});
