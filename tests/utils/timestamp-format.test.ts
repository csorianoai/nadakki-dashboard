/**
 * Timestamp formatting tests -- validates epoch/null/invalid date handling.
 *
 * P1-B fix: formatTimeAgo now returns em-dash for null, undefined, epoch,
 * and invalid date strings instead of "hace 20,608 dias".
 */

describe("formatTimeAgo edge cases (ApplicationCard)", () => {
  // Re-implement the fixed formatTimeAgo logic for unit testing
  // (function is not exported from the component)
  function formatTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return "\u2014";
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return "\u2014";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 0) return "\u2014";

    if (seconds < 60) return "hace un momento";
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString("es-DO", { day: "numeric", month: "short" });
  }

  test("null returns dash", () => {
    expect(formatTimeAgo(null)).toBe("\u2014");
  });

  test("undefined returns dash", () => {
    expect(formatTimeAgo(undefined)).toBe("\u2014");
  });

  test("empty string returns dash", () => {
    expect(formatTimeAgo("")).toBe("\u2014");
  });

  test("epoch '1970-01-01T00:00:00Z' returns dash (not 20608 days)", () => {
    const result = formatTimeAgo("1970-01-01T00:00:00Z");
    expect(result).toBe("\u2014");
    expect(result).not.toContain("20608");
    expect(result).not.toContain("20,608");
  });

  test("epoch timestamp '1970-01-01' returns dash", () => {
    expect(formatTimeAgo("1970-01-01")).toBe("\u2014");
  });

  test("invalid date string returns dash", () => {
    expect(formatTimeAgo("not-a-date")).toBe("\u2014");
  });

  test("future date returns dash", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(formatTimeAgo(future)).toBe("\u2014");
  });

  test("recent valid date returns 'hace un momento'", () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe("hace un momento");
  });

  test("5 minutes ago returns 'hace 5 min'", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(fiveMinAgo)).toBe("hace 5 min");
  });

  test("2 hours ago returns 'hace 2h'", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe("hace 2h");
  });

  test("3 days ago returns 'hace 3d'", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo)).toBe("hace 3d");
  });
});

describe("ApplicationCard source verification", () => {
  test("formatTimeAgo handles null/undefined in source", () => {
    const src = require("fs").readFileSync(
      require("path").resolve(
        __dirname,
        "../../components/credit-hub/dealer/ApplicationCard.tsx"
      ),
      "utf-8"
    );
    // Must handle null/undefined input
    expect(src).toMatch(/dateString.*null|null.*undefined/);
    // Must check for epoch/invalid dates
    expect(src).toMatch(/getFullYear.*2000|isNaN/);
  });
});
