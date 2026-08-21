import { formatDominicanCedula, cleanDominicanCedula } from "../dominican-id";

describe("formatDominicanCedula", () => {
  it("formats empty string", () => {
    expect(formatDominicanCedula("")).toBe("");
  });

  it("formats 3 digits without dashes", () => {
    expect(formatDominicanCedula("275")).toBe("275");
  });

  it("formats 4-10 digits with one dash", () => {
    expect(formatDominicanCedula("2757")).toBe("275-7");
    expect(formatDominicanCedula("27576")).toBe("275-76");
    expect(formatDominicanCedula("275760")).toBe("275-760");
    expect(formatDominicanCedula("2757600")).toBe("275-7600");
    expect(formatDominicanCedula("27576001")).toBe("275-76001");
    expect(formatDominicanCedula("275760011")).toBe("275-760011");
    expect(formatDominicanCedula("2757600111")).toBe("275-7600111");
  });

  it("formats 11 digits with two dashes (full format)", () => {
    expect(formatDominicanCedula("27576001112")).toBe("275-7600111-2");
  });

  it("handles already formatted input", () => {
    expect(formatDominicanCedula("275-7600111-2")).toBe("275-7600111-2");
  });

  it("does not corrupt partial input (user reported bug)", () => {
    // User reported: 275760-01-11 corruption
    // This was caused by formatDominicanCedula not being idempotent
    const partial = "27576001";
    const formatted = formatDominicanCedula(partial);
    expect(formatted).toBe("275-76001"); // Not "275760-01-11"
    
    // Re-formatting should be idempotent
    const reformatted = formatDominicanCedula(formatted);
    expect(reformatted).toBe("275-76001");
  });

  it("strips excess digits beyond 11", () => {
    expect(formatDominicanCedula("275760011129999")).toBe("275-7600111-2");
  });
});

describe("cleanDominicanCedula", () => {
  it("removes all non-digits", () => {
    expect(cleanDominicanCedula("275-7600111-2")).toBe("27576001112");
  });

  it("strips excess digits beyond 11", () => {
    expect(cleanDominicanCedula("275760011129999")).toBe("27576001112");
  });

  it("handles already clean input", () => {
    expect(cleanDominicanCedula("27576001112")).toBe("27576001112");
  });
});
