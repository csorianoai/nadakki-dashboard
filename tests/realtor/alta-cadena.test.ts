jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { DATOS_VACIOS, enviarAlta, mensajeError, validar, verificarLicencia, ErrorAlta, type Datos, type Perfil } from "@/lib/realtor/alta";
import { respuesta as json } from "./fake";

const PERSONA = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const perfil: Perfil = { owner_person_id: PERSONA, jurisdiction_code: "US-FL", default_language: "es", kind: "agent" };
const datos: Datos = { ...DATOS_VACIOS, licencia: "SL3456789", nombre: "Ana", marca: { nombre: "Casa Ana", slug: "casa-ana", frase: "" } };
const LIC_ID = "11111111-2222-3333-4444-555555555555";

type Llamada = { m: string; r: string; body?: string };
function backend(sobre: (m: string, r: string) => Promise<Response> | undefined = () => undefined) {
  const llamadas: Llamada[] = [];
  const enviar = jest.fn((ruta: string, init: RequestInit = {}) => {
    const r = ruta.replace("/api/v1/realestate/alta", "");
    const m = init.method ?? "GET";
    llamadas.push({ m, r, body: init.body as string | undefined });
    const o = sobre(m, r);
    if (o) return o;
    if (m === "GET" && r.startsWith("/agents?")) return json({ items: [], next_cursor: null });
    if (m === "POST" && r === "/agents") return json({ id: "ag-1" }, 201);
    if (m === "POST" && r === "/licenses") return json({ id: LIC_ID, status: "pending_verification" }, 201);
    if (m === "PUT" && r.endsWith("/license")) return json({ id: "ag-1" });
    if (m === "POST" && r === "/brands") return json({ id: "br-1" }, 201);
    if (r.endsWith("/readiness")) return json({ checks: [{ check: "license_verified", passed: false }] });
    return json({}, 404);
  });
  return { llamadas, enviar };
}
const rutas = (l: Llamada[]) => l.map((c) => `${c.m} ${c.r.split("?")[0]}`);

describe("alta sobre la cadena del backend", () => {
  it("el numero de licencia no tiene que ser UUID", () => {
    expect(validar(datos).licencia).toBeUndefined();
    expect(validar({ ...datos, licencia: "" }).licencia).toBe(true);
    expect(validar({ ...datos, licencia: "x".repeat(65) }).licencia).toBe(true);
  });

  it("agente nuevo: lista, crea, registra la licencia por numero, la vincula por UUID", async () => {
    const { llamadas, enviar } = backend();
    const r = await enviarAlta(datos, perfil, "k1", enviar);
    expect(rutas(llamadas)).toEqual([
      "GET /agents", "POST /agents", "POST /licenses", "PUT /agents/ag-1/license", "POST /brands", "GET /agents/ag-1/readiness",
    ]);
    const lic = JSON.parse(llamadas.find((c) => c.r === "/licenses")!.body!);
    expect(lic).toMatchObject({ holder_person_id: PERSONA, jurisdiction_code: "US-FL", license_number: "SL3456789" });
    expect(lic).not.toHaveProperty("tenant_id");
    expect(lic).not.toHaveProperty("status");
    expect(JSON.parse(llamadas.find((c) => c.r.endsWith("/license"))!.body!)).toEqual({ license_id: LIC_ID });
    expect(r).toMatchObject({ agente_id: "ag-1", licencia_id: LIC_ID, licencia_estado: "pending_verification" });
  });

  it("agente ya existente: lo recupera y NO hace POST /agents", async () => {
    const { llamadas, enviar } = backend((m, r) => (m === "GET" && r.startsWith("/agents?") ? json({ items: [{ id: "ag-9", person_id: PERSONA }] }) : undefined));
    const r = await enviarAlta(datos, perfil, "k2", enviar);
    expect(rutas(llamadas)).not.toContain("POST /agents");
    expect(rutas(llamadas)).toContain("PUT /agents/ag-9/license");
    expect(r.agente_id).toBe("ag-9");
  });

  it("409 al crear: recupera el agente con GET /agents y sigue", async () => {
    let listados = 0;
    const { llamadas, enviar } = backend((m, r) => {
      if (m === "GET" && r.startsWith("/agents?")) return json({ items: ++listados > 1 ? [{ id: "ag-7", person_id: PERSONA }] : [] });
      if (m === "POST" && r === "/agents") return json({}, 409);
      return undefined;
    });
    const r = await enviarAlta(datos, perfil, "k3", enviar);
    expect(r.agente_id).toBe("ag-7");
    expect(rutas(llamadas)).toContain("PUT /agents/ag-7/license");
  });

  it("agente con licencia ya vinculada: no registra otra", async () => {
    const { llamadas, enviar } = backend((m, r) => (m === "GET" && r.startsWith("/agents?") ? json({ items: [{ id: "ag-9", person_id: PERSONA, license_id: LIC_ID }] }) : undefined));
    await enviarAlta(datos, perfil, "k4", enviar);
    expect(rutas(llamadas)).not.toContain("POST /licenses");
  });

  it("nunca llama a /brokerage con POST", async () => {
    const { llamadas, enviar } = backend((m, r) => (r === "/brokerage" ? json({ id: "bk-1" }) : undefined));
    await enviarAlta(datos, { ...perfil, kind: "brokerage" }, "k5", enviar);
    expect(rutas(llamadas)).not.toContain("POST /brokerage");
  });

  it("verificarLicencia: PUT con outcome verified, sin tenant ni fecha", async () => {
    const { llamadas, enviar } = backend((m, r) => (m === "PUT" && r.endsWith("/verification") ? json({ id: LIC_ID, status: "verified" }) : undefined));
    const l = await verificarLicencia(LIC_ID, "verified", enviar);
    expect(l.status).toBe("verified");
    expect(llamadas[0]).toMatchObject({ m: "PUT", r: `/licenses/${LIC_ID}/verification` });
    expect(JSON.parse(llamadas[0].body!)).toEqual({ outcome: "verified" });
  });

  it("verificarLicencia: 403 y 409 llegan como ErrorAlta con su estado", async () => {
    for (const s of [403, 404, 409, 422]) {
      const { enviar } = backend(() => json({}, s));
      await expect(verificarLicencia(LIC_ID, "verified", enviar)).rejects.toBeInstanceOf(ErrorAlta);
      await expect(verificarLicencia(LIC_ID, "verified", enviar)).rejects.toMatchObject({ estado: s });
    }
  });

  it("mensajes distintos para 403, 404, 409 y 422 (es y en)", () => {
    for (const i of ["es", "en"] as const) {
      const m = [403, 404, 409, 422, 500].map((s) => mensajeError(s, i));
      expect(new Set(m).size).toBe(5);
    }
  });
});
