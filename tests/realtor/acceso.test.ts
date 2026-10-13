jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { consultarAcceso, modoDemo, panelEncendido } from "@/lib/realtor/acceso";
import { respuesta } from "./fake";

const res = (status: number) => respuesta({}, status);

describe("acceso Realtor (fail-closed)", () => {
  it("positivo: solo un 200 abre el panel", async () => {
    const f = jest.fn(() => res(200));
    expect(await consultarAcceso(f)).toBe(true);
    expect(f.mock.calls[0][0]).toBe("/api/v1/realestate/acceso");
  });
  it.each([401, 403, 404, 204, 500])("negativo: %s no abre el panel", async (s) => {
    expect(await consultarAcceso(() => res(s))).toBe(false);
  });
  it("negativo: un error de red no abre el panel", async () => {
    expect(await consultarAcceso(() => Promise.reject(new Error("net")))).toBe(false);
  });
  it("tenant ajeno: la consulta no envia tenant alguno", async () => {
    const f = jest.fn(() => res(403));
    expect(await consultarAcceso(f)).toBe(false);
    const [ruta, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(ruta).not.toMatch(/tenant_id|x-tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant_id|x-tenant/i);
  });
  it("interruptor apagado por defecto y DEMO nunca en produccion", () => {
    expect(panelEncendido({})).toBe(false);
    expect(panelEncendido({ NEXT_PUBLIC_REALTOR_PANEL: "true" })).toBe(false);
    expect(panelEncendido({ NEXT_PUBLIC_REALTOR_PANEL: "1" })).toBe(true);
    expect(modoDemo({ NODE_ENV: "production", NEXT_PUBLIC_REALTOR_DEMO: "1" })).toBe(false);
    expect(modoDemo({ NODE_ENV: "development", NEXT_PUBLIC_REALTOR_DEMO: "1" })).toBe(true);
    expect(modoDemo({ NODE_ENV: "development" })).toBe(false);
  });
});
