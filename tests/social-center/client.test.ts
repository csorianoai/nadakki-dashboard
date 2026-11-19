/**
 * SOC-D-CUENTAS 1/2 (hito B1, C-SOCIAL-D0): cliente tipado del contrato. Se prueba con fetch simulado.
 */
import { createSocialClient } from "@/lib/social-center/client";

describe("cliente tipado del contrato", () => {
  const json = (body: unknown, status = 200) =>
    Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);

  it("lee con X-Tenant-ID; el tenant nunca viaja en el cuerpo y las escrituras llevan Idempotency-Key e If-Match", async () => {
    const f = jest.fn().mockReturnValue(json({ items: [], next_cursor: null }));
    const c = createSocialClient({ tenantId: "t-1", fetchFn: f as unknown as typeof fetch });
    await c.listBrands();
    expect(f.mock.calls[0][0]).toMatch(/\/api\/v1\/social\/brands/);
    expect(new Headers(f.mock.calls[0][1].headers).get("X-Tenant-ID")).toBe("t-1");

    f.mockReturnValue(json({ id: "a" }));
    await c.updateAccount("a", 3, { handle: "x" });
    const init = f.mock.calls[1][1];
    const h = new Headers(init.headers);
    expect(init.method).toBe("PATCH");
    expect(h.get("If-Match")).toBe("3");
    expect(h.get("Idempotency-Key")).toBeTruthy();
    expect(init.body).not.toMatch(/tenant/i);
  });

  it("red caida o 404 => ok:false, sin lanzar", async () => {
    const c1 = createSocialClient({ tenantId: "t-1", fetchFn: (() => Promise.reject(new Error("net"))) as unknown as typeof fetch });
    expect((await c1.listBrands()).ok).toBe(false);
    const c2 = createSocialClient({ tenantId: "t-1", fetchFn: (() => json({ code: "NOT_FOUND", message: "x" }, 404)) as unknown as typeof fetch });
    expect((await c2.listBrands()).ok).toBe(false);
  });

  it("sin tenant no hace ninguna peticion (fail closed)", async () => {
    const f = jest.fn();
    const c = createSocialClient({ tenantId: null, fetchFn: f as unknown as typeof fetch });
    expect((await c.listBrands()).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
