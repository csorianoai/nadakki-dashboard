import { BASE_BROKER } from "@/lib/realtor/broker/client";
import { ACCESS_PATH } from "@/lib/realtor/config";
import { qaDecidir, qaEsRevisor, qaHistorial, type QaEnviar } from "@/components/realtor/broker/qa-client";

// Contrato REAL del backend (nadakki-ai-suite): routes/real_estate/journey/broker_desk.py (#2463) y
// routes/real_estate/kernel/acceso.py (#2473). POST .../qa-decision {decision: approve|return|reject} con
// extra="forbid"; GET .../qa-decisions -> {qa_decisions: [{qa_decision, reviewer_user_id, at}]}; /acceso -> qa_reviewer.
const responder = (status: number, cuerpo: unknown = {}): jest.MockedFunction<QaEnviar> =>
  jest.fn(async () => ({ status, json: async () => cuerpo }) as unknown as Response);

describe("qaEsRevisor (GET /acceso, campo qa_reviewer): negativos primero", () => {
  it.each([
    ["sin el campo (backend anterior)", 200, { allowed: true, roles: ["agent"] }],
    ["qa_reviewer false (Cesar, B o X)", 200, { allowed: true, roles: ["agent"], qa_reviewer: false }],
    ["qa_reviewer como texto", 200, { allowed: true, roles: ["agent"], qa_reviewer: "true" }],
    ["un rol llamado qa_reviewer no basta", 200, { allowed: true, roles: ["qa_reviewer"] }],
    ["403 de la puerta", 403, { detail: "tenant_no_habilitado" }],
    ["500", 500, {}],
  ] as const)("%s -> no es revisor", async (_n, status, cuerpo) => {
    const enviar = responder(status, cuerpo);
    expect(await qaEsRevisor(enviar)).toBe(false);
    expect(enviar.mock.calls[0][0]).toBe(ACCESS_PATH);
  });

  it("un fallo de red no es revisor", async () => {
    expect(await qaEsRevisor(jest.fn(async () => { throw new Error("red"); }))).toBe(false);
  });

  it("qa_reviewer true (Paula-QA) -> es revisor", async () => {
    expect(await qaEsRevisor(responder(200, { allowed: true, roles: ["agent"], qa_reviewer: true }))).toBe(true);
  });
});

describe("qaDecidir (POST /broker-desk/items/{id}/qa-decision)", () => {
  it.each([[403, "prohibido"], [404, "no-existe"], [409, "conflicto"], [422, "invalido"], [500, "error"]] as const)(
    "%s se traduce a %s", async (status, motivo) => {
      expect(await qaDecidir("x", "reject", responder(status))).toEqual({ estado: "error", motivo });
    });

  it("un fallo de red es error", async () => {
    expect(await qaDecidir("x", "return", jest.fn(async () => { throw new Error("red"); }))).toEqual({ estado: "error", motivo: "error" });
  });

  it.each(["approve", "return", "reject"] as const)("envia SOLO {decision: %s}: sin reason, sin tenant", async (d) => {
    const resp = { item_id: "a/b", qa_decision: d, item_status: "pending", legal_effect: false, test: true, qa_decisions: [] };
    const enviar = responder(200, resp);
    expect(await qaDecidir("a/b", d, enviar)).toEqual({ estado: "ok", datos: resp });
    const [ruta, init] = enviar.mock.calls[0];
    expect(ruta).toBe(`${BASE_BROKER}/items/a%2Fb/qa-decision`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ decision: d });
    expect(String(init?.body)).not.toMatch(/reason|tenant/i);
  });
});

describe("qaHistorial (GET .../qa-decisions)", () => {
  it("lee qa_decisions con su forma real", async () => {
    const e = { qa_decision: "return", reviewer_user_id: "u-paula", at: "2026-10-27T13:09:48Z" };
    const enviar = responder(200, { item_id: "p1", item_status: "pending", legal_effect: false, test: true, qa_decisions: [e] });
    expect(await qaHistorial("p1", enviar)).toEqual({ estado: "ok", datos: [e] });
    expect(enviar.mock.calls[0][0]).toBe(`${BASE_BROKER}/items/p1/qa-decisions`);
  });
  it("404 es vacio; 403 y otros fallos son error", async () => {
    expect(await qaHistorial("p1", responder(404))).toEqual({ estado: "vacio" });
    expect(await qaHistorial("p1", responder(403))).toEqual({ estado: "error" });
    expect(await qaHistorial("p1", responder(500))).toEqual({ estado: "error" });
  });
});
