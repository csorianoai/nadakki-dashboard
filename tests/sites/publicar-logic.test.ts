import { checkOverride, parseField } from "@/lib/sites/publicar/logic";

describe("publicar/logic", () => {
  const now = new Date(2026, 9, 18, 12);
  test("parseField resuelve paginas y bloques; lo demas queda como texto", () => {
    expect(parseField("pages[contact].body[2]")).toEqual({ page: "contact", block: 2 });
    expect(parseField("pages[home]")).toEqual({ page: "home", block: null });
    expect(parseField("listings[casa-1]")).toBeNull();
    expect(parseField("")).toBeNull();
  });
  test("checkOverride exige justificacion y fecha estrictamente futura", () => {
    expect(checkOverride("  ", "2026-12-01", now)).toEqual({ ok: false, error: "justification" });
    expect(checkOverride("ok", "2026-10-18", now)).toEqual({ ok: false, error: "future" });
    expect(checkOverride("ok", "", now)).toEqual({ ok: false, error: "future" });
    expect(checkOverride(" ok ", "2026-10-19", now)).toEqual({ ok: true, justification: "ok", expires_at: "2026-10-19T23:59:59Z" });
  });
});
