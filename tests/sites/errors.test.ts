import { errorFromResponse, SitesApiError } from "@/lib/sites/errors";
import type { Violation } from "@/lib/sites/types";
import { resp } from "./fake";

const problem = (status: number, code: string, extra: object = {}) =>
  resp({ type: "about:blank", title: code, status, code, ...extra }, status, "application/problem+json");

describe("errorFromResponse", () => {
  it("parsea application/problem+json: status y codigo estable (positivo)", async () => {
    const e = await errorFromResponse(problem(409, "CONFLICT", { detail: "version vieja" }));
    expect(e).toBeInstanceOf(SitesApiError);
    expect([e.status, e.code, e.message]).toEqual([409, "CONFLICT", "version vieja"]);
    expect(e.violations).toBeUndefined();
  });

  it("404 NOT_FOUND (recurso de otro tenant): error 'no encontrado' sin filtrar nada del servidor", async () => {
    const e = await errorFromResponse(problem(404, "NOT_FOUND", { detail: "x" }));
    expect(e.code).toBe("NOT_FOUND");
    expect(e.violations).toBeUndefined();
  });

  it("403 TENANT_MISMATCH es un error, nunca un dato", async () => {
    const e = await errorFromResponse(problem(403, "TENANT_MISMATCH"));
    expect([e.status, e.code]).toEqual([403, "TENANT_MISMATCH"]);
  });

  it("tolera cuerpo ilegible (HTML, vacio, JSON sin code): UNKNOWN y status conservado", async () => {
    for (const r of [resp("<html>boom</html>", 502, "text/html"), resp("", 500), resp({ x: 1 }, 400)]) {
      const e = await errorFromResponse(r);
      expect(e.code).toBe("UNKNOWN");
      expect(e.message).toMatch(/^HTTP \d{3}$/);
    }
  });

  it("422 PUBLISH_BLOCKED -> violations tipadas con las cuatro claves; descarta elementos mal formados", async () => {
    const v: Violation = { rule_id: "RE-ABC-001", severity: "block", message: "falta licencia", field: "legal" };
    const e = await errorFromResponse(problem(422, "PUBLISH_BLOCKED", { violations: [v, { rule_id: 1 }, null] }));
    expect(e.violations).toEqual([v]);
    expect(Object.keys(e.violations![0]).sort()).toEqual(["field", "message", "rule_id", "severity"]);
  });

  it("violations solo se exponen en PUBLISH_BLOCKED", async () => {
    const v = { rule_id: "RE-ABC-001", severity: "warn", message: "m", field: "f" };
    expect((await errorFromResponse(problem(422, "VALIDATION_ERROR", { violations: [v] }))).violations).toBeUndefined();
  });
});
