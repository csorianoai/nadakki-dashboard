/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/assistant/[[...path]]/route";
jest.mock("@/lib/config/backend-url", () => ({ resolveBackendUrl: () => "https://backend.example/" }));
const originalFetch = global.fetch;
const upstream = jest.fn();
beforeEach(() => { upstream.mockReset(); global.fetch = upstream; });
afterAll(() => { global.fetch = originalFetch; });
const context = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });
it.each(["contable/chat", "contable/ia/chat", "contable/ia/confirmar"])("reenvia POST %s con cuerpo y JWT", async (path) => {
 upstream.mockResolvedValue(new Response('{"response":"Hola"}', { headers: { "Content-Type": "application/json" } }));
 const body = JSON.stringify({ message: "Consulta" });
 const result = await POST(new NextRequest(`https://dashboard.example/api/assistant/${path}?x=1`, { method: "POST", headers: { Authorization: "Bearer jwt", "Content-Type": "application/json", "x-resolved-tenant-id": "t" }, body }), context(path));
 expect(result.status).toBe(200);
 const [url, init] = upstream.mock.calls[0];
 expect(url).toBe(`https://backend.example/api/assistant/${path}?x=1`);
 expect(init.headers).toMatchObject({ Authorization: "Bearer jwt", "X-Tenant-ID": "t", "Content-Type": "application/json" });
 expect(new TextDecoder().decode(init.body)).toBe(body);
});
it.each([401, 500])("preserva status %s y cuerpo exacto", async (status) => {
 const body = ' {"detail":{"code":"fallo"}}\n';
 upstream.mockResolvedValue(new Response(body, { status, headers: { "Content-Type": "application/json" } }));
 const result = await GET(new NextRequest("https://dashboard.example/api/assistant/contable/chat"), context("contable/chat"));
 expect(result.status).toBe(status); expect(await result.text()).toBe(body);
});
it.each(["otro", "contable/admin", "", "contable/chat/extra"])("rechaza ruta %s sin backend", async (path) => {
 const result = await POST(new NextRequest("https://dashboard.example/api/assistant/" + path, { method: "POST" }), context(path));
 expect(result.status).toBe(404); expect(upstream).not.toHaveBeenCalled();
});
it("red devuelve 502", async () => {
 upstream.mockRejectedValue(new Error("red"));
 const result = await GET(new NextRequest("https://dashboard.example/api/assistant/contable/chat"), context("contable/chat"));
 expect(result.status).toBe(502);
});
it("confirmar reenvia el id y devuelve la respuesta del backend", async () => {
 upstream.mockResolvedValue(new Response('{"response":"Listo","links":["/autos/dealer/inventario/v1"]}', { headers: { "Content-Type": "application/json" } }));
 const body = JSON.stringify({ id: "tok" });
 const result = await POST(new NextRequest("https://dashboard.example/api/assistant/contable/ia/confirmar", { method: "POST", headers: { Authorization: "Bearer jwt", "Content-Type": "application/json" }, body }), context("contable/ia/confirmar"));
 expect(result.status).toBe(200);
 expect(await result.json()).toEqual({ response: "Listo", links: ["/autos/dealer/inventario/v1"] });
 expect(upstream.mock.calls[0][0]).toBe("https://backend.example/api/assistant/contable/ia/confirmar");
 expect(upstream.mock.calls[0][1].method).toBe("POST");
});
it("confirmar por GET da 405 sin backend", async () => {
 const result = await GET(new NextRequest("https://dashboard.example/api/assistant/contable/ia/confirmar"), context("contable/ia/confirmar"));
 expect(result.status).toBe(405); expect(result.headers.get("Allow")).toBe("POST"); expect(upstream).not.toHaveBeenCalled();
});
it("la ruta del cliente del asistente es la que el proxy deja pasar", async () => {
 const { RUTA_CONFIRMAR } = await import("@/lib/agents/contable/asistente-client");
 expect(RUTA_CONFIRMAR).toBe("/api/assistant/contable/ia/confirmar");
});
