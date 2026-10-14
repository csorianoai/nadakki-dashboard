jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { DATOS_VACIOS, enviarAlta, validar, type Datos, type Perfil } from "@/lib/realtor/alta";
import { respuesta } from "./fake";

const LIC = "11111111-2222-3333-4444-555555555555";
const perfil: Perfil = { owner_person_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", jurisdiction_code: "DO", default_language: "es", kind: "agent" };
const datos: Datos = {
  ...DATOS_VACIOS,
  licencia: LIC,
  nombre: "Ana Prueba",
  marca: { nombre: "Casa Ana", slug: "casa-ana", frase: "" },
};
const json = respuesta;

function backend() {
  const llamadas: { ruta: string; init: RequestInit }[] = [];
  const enviar = jest.fn((ruta: string, init: RequestInit = {}) => {
    llamadas.push({ ruta, init });
    if (ruta.endsWith("/agents")) return json({ id: "ag-1" }, 201);
    if (ruta.endsWith("/license")) return json({ id: "ag-1" });
    if (ruta.endsWith("/brands")) return json({ id: "br-1" }, 201);
    if (ruta.endsWith("/readiness")) return json({ checks: [{ check: "license_verified", passed: false }] });
    if (init.method === "GET" && ruta.endsWith("/brokerage")) return json({}, 404);
    return json({ id: "bk-1" }, 201);
  });
  return { llamadas, enviar };
}

describe("alta del agente", () => {
  it("positivo: encadena agente, licencia, marca y revision con Idempotency-Key", async () => {
    const { llamadas, enviar } = backend();
    const r = await enviarAlta(datos, perfil, "k1", enviar);
    expect(r).toMatchObject({ agente_id: "ag-1", marca_id: "br-1", demo: false });
    expect(llamadas.map((c) => c.ruta.replace("/api/v1/realestate/alta", ""))).toEqual([
      "/agents", "/agents/ag-1/license", "/brands", "/agents/ag-1/readiness",
    ]);
    for (const c of llamadas.slice(0, 3)) expect((c.init.headers as Record<string, string>)["Idempotency-Key"]).toMatch(/^k1:/);
  });

  it("negativo: datos invalidos no pasan la validacion", () => {
    expect(validar(datos)).toEqual({});
    expect(Object.keys(validar({ ...datos, licencia: "no-es-uuid", marca: { ...datos.marca, slug: "A_" } })).sort()).toEqual(["licencia", "slug"]);
    expect(validar({ ...datos, broker: { usar: true, razonSocial: "", nombre: "" } }).razonSocial).toBeUndefined();
    expect(validar(datos, "brokerage").razonSocial).toBe(true);
  });

  it("negativo: un fallo del backend corta el flujo sin llegar a la marca", async () => {
    const { llamadas, enviar } = backend();
    enviar.mockImplementationOnce((ruta: string, init: RequestInit = {}) => { llamadas.push({ ruta, init }); return json({}, 422); });
    await expect(enviarAlta(datos, perfil, "k2", enviar)).rejects.toMatchObject({ estado: 422 });
    expect(llamadas).toHaveLength(1);
  });

  it("kind=agent: nunca crea firma ni manda brokerage_id, aunque marque broker", async () => {
    const { llamadas, enviar } = backend();
    await enviarAlta({ ...datos, broker: { usar: true, razonSocial: "Broker SA", nombre: "Broker" } }, perfil, "k5", enviar);
    expect(llamadas.some((c) => c.ruta.endsWith("/brokerage"))).toBe(false);
    expect(llamadas.find((c) => c.ruta.endsWith("/agents"))!.init.body).not.toMatch(/brokerage_id/);
  });

  it("kind=brokerage: crea la firma y manda siempre su brokerage_id; si ya existe, la reutiliza", async () => {
    const firma: Perfil = { ...perfil, kind: "brokerage" };
    const b = { ...datos, broker: { usar: false, razonSocial: "Broker SA", nombre: "Broker" } };
    const nueva = backend();
    await enviarAlta(b, firma, "k6", nueva.enviar);
    expect(nueva.llamadas.slice(0, 3).map((c) => `${c.init.method} ${c.ruta.replace("/api/v1/realestate/alta", "")}`)).toEqual(["GET /brokerage", "POST /brokerage", "POST /agents"]);
    expect(nueva.llamadas.find((c) => c.ruta.endsWith("/agents"))!.init.body).toMatch(/"brokerage_id":"bk-1"/);
    const existente = backend();
    existente.enviar.mockImplementationOnce((ruta: string, init: RequestInit = {}) => { existente.llamadas.push({ ruta, init }); return json({ id: "bk-9" }); });
    await enviarAlta(b, firma, "k7", existente.enviar);
    expect(existente.llamadas.some((c) => c.init.method === "POST" && c.ruta.endsWith("/brokerage"))).toBe(false);
    expect(existente.llamadas.find((c) => c.ruta.endsWith("/agents"))!.init.body).toMatch(/"brokerage_id":"bk-9"/);
  });

  it("la Idempotency-Key cambia si cambia el cuerpo del mismo paso", async () => {
    const clave = async (lic: string) => {
      const { llamadas, enviar } = backend();
      await enviarAlta({ ...datos, licencia: lic }, perfil, "k8", enviar);
      return (llamadas.find((c) => c.ruta.endsWith("/license"))!.init.headers as Record<string, string>)["Idempotency-Key"];
    };
    expect(await clave(LIC)).not.toBe(await clave("11111111-2222-3333-4444-555555555556"));
  });

  it("tenant ajeno: ninguna peticion lleva tenant y un 404/403 del servidor se propaga", async () => {
    const { llamadas, enviar } = backend();
    await enviarAlta(datos, perfil, "k3", enviar);
    for (const c of llamadas) {
      expect(c.ruta).not.toMatch(/tenant_id|x-tenant/i);
      expect(JSON.stringify(c.init)).not.toMatch(/tenant_id|x-tenant/i);
    }
    for (const status of [403, 404]) {
      const ajeno = jest.fn(() => json({ code: "TENANT_MISMATCH" }, status));
      await expect(enviarAlta(datos, perfil, "k4", ajeno)).rejects.toMatchObject({ estado: status });
    }
  });
});
