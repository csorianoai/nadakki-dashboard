/**
 * Guarda de fixtures de Monetizacion (P1). El adapter lee el flag al cargar el
 * modulo, asi que cada caso lo importa aislado con su entorno.
 */
type Entorno = { nodeEnv: string; useApi: boolean };

function cargarAdapter({ nodeEnv, useApi }: Entorno) {
  const env = process.env as Record<string, string | undefined>;
  env.NODE_ENV = nodeEnv;
  if (useApi) env.NEXT_PUBLIC_FM_USE_API = "true";
  else delete env.NEXT_PUBLIC_FM_USE_API;
  let adapter: typeof import("@/lib/credit-hub/monetizacion/adapter") | undefined;
  jest.isolateModules(() => {
    adapter = require("@/lib/credit-hub/monetizacion/adapter");
  });
  return adapter!;
}

describe("Monetizacion: datos de demostracion solo fuera de produccion", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    jest.resetModules();
  });

  it("produccion sin API: no sirve fixtures, falla para que la pantalla muestre su estado de error", async () => {
    const adapter = cargarAdapter({ nodeEnv: "production", useApi: false });
    await expect(adapter.fetchDashboardKpis()).rejects.toThrow(/mock blocked in production/);
    await expect(adapter.fetchTenants()).rejects.toThrow(/mock blocked in production/);
    await expect(adapter.fetchBankMetrics("banco-cibao")).rejects.toThrow(/mock blocked in production/);
  });

  it("produccion con API: va al backend, nunca a la guarda", async () => {
    jest.doMock("@/lib/credit-hub/monetizacion/api-client", () => ({
      monetizacionFetch: jest.fn(async () => {
        throw new Error("backend");
      }),
    }));
    const adapter = cargarAdapter({ nodeEnv: "production", useApi: true });
    await expect(adapter.fetchDashboardKpis()).rejects.toThrow("backend");
  });

  it("desarrollo sin API: sigue usando los fixtures locales", async () => {
    const adapter = cargarAdapter({ nodeEnv: "development", useApi: false });
    const tenants = await adapter.fetchTenants();
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBeGreaterThan(0);
  });
});
