import { scrubSentryEvent, scrubUnknown } from "@/lib/observability/telemetry";

describe("PII masking (SPEC-T3-002 alignment)", () => {
  test("masks any email to x***@***.com", () => {
    expect(scrubUnknown({ contact: "ana.garcia@empresa.com.do" })).toEqual({ contact: "x***@***.com" });
  });

  test("masks NA phone numbers to XXX-XXX-XXXX", () => {
    expect(scrubUnknown({ tel: "(809) 555-1234" })).toEqual({ tel: "XXX-XXX-XXXX" });
    expect(scrubUnknown({ tel: "+1 809-555-9999" })).toEqual({ tel: "XXX-XXX-XXXX" });
  });

  test("masks cédula dashed to XXX-XXXXXXX-X", () => {
    expect(scrubUnknown({ id: "402-1234567-8" })).toEqual({ id: "XXX-XXXXXXX-X" });
  });

  test("masks cédula with spaces to XXX-XXXXXXX-X", () => {
    expect(scrubUnknown({ note: "id 402 1234567 8 ok" })).toEqual({ note: "id XXX-XXXXXXX-X ok" });
  });

  test("scrubSentryEvent masks composite message", () => {
    const ev = scrubSentryEvent({
      message: "User foo@bar.com ced 402-9876543-1 tel +1 809-555-0199",
    } as Parameters<typeof scrubSentryEvent>[0]);
    expect(ev.message).toContain("x***@***.com");
    expect(ev.message).toContain("XXX-XXXXXXX-X");
    expect(ev.message).toContain("XXX-XXX-XXXX");
  });

  test("redacts values for cedula-related keys", () => {
    expect(scrubUnknown({ cedula: "402-1234567-8" })).toEqual({ cedula: "[redacted]" });
  });
});
