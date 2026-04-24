import { describe, expect, it } from "@jest/globals";
import {
  buildAgentRegistryTooltip,
  parseAgentRegistrySummary,
  unwrapSummaryPayload,
} from "@/lib/agent-registry/parse-summary";

describe("parseAgentRegistrySummary", () => {
  it("prefers executable_agents over official_total", () => {
    const s = parseAgentRegistrySummary({
      executable_agents: 63,
      official_total: 400,
    });
    expect(s?.displayCount).toBe(63);
    expect(s?.countKind).toBe("executable");
  });

  it("unwraps data envelope", () => {
    const s = parseAgentRegistrySummary({
      data: {
        executable_agents: 12,
        live: 10,
        feature_flagged: 1,
        duplicate: 0,
        hidden: 1,
        broken: 0,
        total_declared_surface: 99,
      },
    });
    expect(s?.displayCount).toBe(12);
    expect(s?.live).toBe(10);
    expect(s?.feature_flagged).toBe(1);
    expect(s?.duplicate).toBe(0);
    expect(s?.hidden).toBe(1);
    expect(s?.broken).toBe(0);
    expect(s?.totalDeclaredSurface).toBe(99);
  });

  it("falls back to official_total", () => {
    const s = parseAgentRegistrySummary({ official_total: 200 });
    expect(s?.displayCount).toBe(200);
    expect(s?.countKind).toBe("official");
  });

  it("accepts camelCase keys", () => {
    const s = parseAgentRegistrySummary({
      executableAgents: 5,
      featureFlagged: 2,
      totalDeclaredSurface: 20,
    });
    expect(s?.displayCount).toBe(5);
    expect(s?.feature_flagged).toBe(2);
    expect(s?.totalDeclaredSurface).toBe(20);
  });

  it("returns null when no count fields", () => {
    expect(parseAgentRegistrySummary({ live: 1 })).toBeNull();
    expect(parseAgentRegistrySummary(null)).toBeNull();
  });
});

describe("buildAgentRegistryTooltip", () => {
  it("includes breakdown lines", () => {
    const tip = buildAgentRegistryTooltip({
      displayCount: 63,
      countKind: "executable",
      live: 50,
      feature_flagged: 3,
      duplicate: 1,
      hidden: 4,
      broken: 2,
      totalDeclaredSurface: 120,
    });
    expect(tip).toContain("63 executable agents");
    expect(tip).toContain("live: 50");
    expect(tip).toContain("feature_flagged: 3");
    expect(tip).toContain("duplicate: 1");
    expect(tip).toContain("hidden: 4");
    expect(tip).toContain("broken: 2");
    expect(tip).toContain("total declared surface: 120");
  });
});

describe("unwrapSummaryPayload", () => {
  it("returns inner data object", () => {
    const u = unwrapSummaryPayload({ data: { a: 1 }, extra: 2 });
    expect(u?.a).toBe(1);
    expect("extra" in (u as object)).toBe(false);
  });
});
