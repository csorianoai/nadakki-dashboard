import { cleanDominicanCedula, formatDominicanCedula } from "@/lib/credit/formatters/dominican-id";

describe("formatDominicanCedula", () => {
  test("formats progressively", () => {
    expect(formatDominicanCedula("053")).toBe("053");
    expect(formatDominicanCedula("0530003")).toBe("053-0003");
    expect(formatDominicanCedula("05300030532")).toBe("053-0003053-2");
  });

  test("removes non-digits and truncates to 11", () => {
    expect(formatDominicanCedula("053abc00030532xxx99")).toBe("053-0003053-2");
    expect(cleanDominicanCedula("053-0003053-299")).toBe("05300030532");
  });
});
