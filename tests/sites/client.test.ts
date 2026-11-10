jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";
import * as c from "@/lib/sites/client";
import { SitesApiError } from "@/lib/sites/errors";
import { resp, SITE_A, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string, extra = {}) =>
  resp({ type: "x", title: "t", status, code, ...extra }, status, "application/problem+json");
const hdr = (i: number) => f.mock.calls[i][1].headers as Record<string, string>;

beforeEach(() => f.mockReset());

describe("cliente Sites (apiFetch mockeado, 0 red real)", () => {
  test("listSites parsea Site[] tipados y usa /api/v1/sites (positivo)", async () => {
    f.mockResolvedValue(resp({ items: [siteOk], next_cursor: null }));
    const r = await c.listSites({ status: "draft" });
    expect(r.items[0].name.es).toBe("SYNTH Realty");
    expect(f.mock.calls[0][0]).toBe("/api/v1/sites/sites?status=draft");
  });

  test("404 NOT_FOUND -> SitesApiError sin datos (tenant ajeno)", async () => {
    f.mockResolvedValue(problem(404, "NOT_FOUND"));
    const e = await c.getSite(SITE_A).catch((x) => x);
    expect(e).toBeInstanceOf(SitesApiError);
    expect(e).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  test("403 TENANT_MISMATCH -> error, no dato", async () => {
    f.mockResolvedValue(problem(403, "TENANT_MISMATCH"));
    await expect(c.getSite(SITE_A)).rejects.toMatchObject({ status: 403, code: "TENANT_MISMATCH" });
  });

  test("cuerpo con tenant_id (tambien anidado) -> lanza ANTES de llamar a fetch", async () => {
    const mal = { slug: "a", name: "z", tenant_id: "x" } as unknown as Parameters<typeof c.createZone>[1];
    await expect(c.createZone(SITE_A, mal)).rejects.toMatchObject({ code: "TENANT_FIELD_FORBIDDEN" });
    const anidado = { slug: "a", name: "z", extra: [{ tenant_id: "x" }] } as unknown as Parameters<typeof c.createZone>[1];
    await expect(c.createZone(SITE_A, anidado)).rejects.toBeInstanceOf(SitesApiError);
    expect(f).toHaveBeenCalledTimes(0);
  });

  test("toda escritura POST/PUT trae Idempotency-Key", async () => {
    f.mockResolvedValue(resp(siteOk, 201));
    await c.createZone(SITE_A, { slug: "a", name: { es: "Z" } });
    await c.createBuilding(SITE_A, { slug: "a", name: "B" });
    await c.createListing(SITE_A, { slug: "a", title: { es: "x" } });
    await c.createDevelopment(SITE_A, { slug: "a", name: "D" });
    await c.publishSite(SITE_A);
    await c.unpublishSite(SITE_A);
    for (let i = 0; i < f.mock.calls.length; i++) {
      expect(f.mock.calls[i][1].method).toBe("POST");
      expect(hdr(i)["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    }
    expect(new Set(f.mock.calls.map((_, i) => hdr(i)["Idempotency-Key"])).size).toBe(f.mock.calls.length);
  });

  test("el reintento de la MISMA operacion reutiliza la clave; una clave dada se respeta", async () => {
    f.mockRejectedValueOnce(new Error("net")).mockResolvedValueOnce(resp(siteOk, 201));
    await c.createListing(SITE_A, { slug: "a", title: { es: "x" } });
    expect(f).toHaveBeenCalledTimes(2);
    expect(hdr(0)["Idempotency-Key"]).toBe(hdr(1)["Idempotency-Key"]);
    f.mockReset();
    f.mockResolvedValue(resp(siteOk, 201));
    await c.createListing(SITE_A, { slug: "a", title: { es: "x" } }, { idempotencyKey: "k-1" });
    expect(hdr(0)["Idempotency-Key"]).toBe("k-1");
  });

  test("422 PUBLISH_BLOCKED -> violations con las cuatro claves", async () => {
    const v = { rule_id: "FL-ADV-001", severity: "block", message: "m", field: "pages[contact].body[2]" };
    f.mockResolvedValue(problem(422, "PUBLISH_BLOCKED", { violations: [v] }));
    const e = await c.publishSite(SITE_A).catch((x) => x);
    expect(e.code).toBe("PUBLISH_BLOCKED");
    expect(Object.keys(e.violations[0]).sort()).toEqual(["field", "message", "rule_id", "severity"]);
  });

  test("202 -> resultado in_review sin lanzar", async () => {
    f.mockResolvedValue(resp({ site_id: SITE_A, status: "in_review", content_version: 1, evaluation_id: SITE_A, warnings: [], pending_manual_rules: ["FL-ADV-005"] }, 202));
    await expect(c.publishSite(SITE_A)).resolves.toMatchObject({ status: "in_review" });
  });

  test("503 con cuerpo ilegible y red caida -> SitesApiError, nunca datos", async () => {
    f.mockResolvedValue(resp("<html>", 503, "text/html"));
    await expect(c.listSites()).rejects.toMatchObject({ status: 503, code: "UNKNOWN" });
    f.mockReset();
    f.mockRejectedValue(new Error("net"));
    await expect(c.listSites()).rejects.toMatchObject({ status: 0, code: "NETWORK" });
  });

  test("id con separadores se rechaza antes de fetch", async () => {
    await expect(c.getSite("../x")).rejects.toBeInstanceOf(SitesApiError);
    expect(f).toHaveBeenCalledTimes(0);
  });

  test("rutas por operationId", async () => {
    f.mockResolvedValue(resp({ items: [], next_cursor: null }));
    await c.listPages(SITE_A); await c.listListings(SITE_A); await c.listDevelopments(SITE_A);
    await c.listZones(SITE_A); await c.listBuildings(SITE_A); await c.listMedia(SITE_A); await c.listEvaluations(SITE_A);
    expect(f.mock.calls.map((x) => x[0])).toEqual(
      ["pages", "listings", "developments", "zones", "buildings", "media", "evaluations"].map((n) => `/api/v1/sites/sites/${SITE_A}/${n}`),
    );
  });
});
