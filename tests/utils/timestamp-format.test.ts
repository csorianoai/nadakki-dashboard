/**
 * Timestamp formatting tests -- validates epoch/null/invalid date handling.
 *
 * P1-B / P1-C: formatTimeAgo + formatSyncAgeMs guard epoch and invalid ms.
 */

import { formatSyncAgeMs, formatTimeAgo } from "@/lib/utils/formatTimestamp";

describe("formatTimeAgo edge cases (ApplicationCard)", () => {

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

  test("2 hours ago returns 'hace 2 h'", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe("hace 2 h");
  });

  test("3 days ago returns 'hace 3d'", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo)).toBe("hace 3 d");
  });
});

describe("formatSyncAgeMs (Ultima sync)", () => {
  test("0 ms returns Nunca (not 20608 days)", () => {
    const result = formatSyncAgeMs(0, "es-DO");
    expect(result).toBe("Nunca");
    expect(result).not.toContain("20608");
  });

  test("undefined returns Nunca", () => {
    expect(formatSyncAgeMs(undefined, "es-DO")).toBe("Nunca");
  });

  test("recent sync returns relative seconds", () => {
    const result = formatSyncAgeMs(Date.now() - 10_000, "es-DO");
    expect(result).not.toBe("Nunca");
    expect(result).not.toContain("20608");
  });
});

describe("ApplicationCard source verification", () => {
  test("uses shared formatTimeAgo utility", () => {
    const src = require("fs").readFileSync(
      require("path").resolve(
        __dirname,
        "../../components/credit-hub/dealer/ApplicationCard.tsx"
      ),
      "utf-8"
    );
    expect(src).toContain("@/lib/utils/formatTimestamp");
    expect(src).toContain("formatTimeAgo");
  });
});
