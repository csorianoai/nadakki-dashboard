import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EstudioGenioPanel } from "@/components/legal/cases/EstudioGenioPanel";
import { apiFetch } from "@/lib/api/fetch-client";
import { listEstudios } from "@/lib/legal/cases/estudio-genio-api";
import m from "@/messages/es/legal-estudio-genio.json";
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const api = apiFetch as jest.Mock;
const study = { estudio_id: "e1", estado: "en_curso", paquete: "completo", iniciado: "2026-11-26T10:00:00Z", fases: [{ fase: "contexto", datos: { secreto: "no mostrar" }, cuando: "2026-11-26T10:01:00Z" }] };
let studies: Record<string, unknown>[];
let enabled: boolean;
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, text: async () => typeof body === "string" ? body : JSON.stringify(body) });
function renderPanel() {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
 const result = render(<QueryClientProvider client={client}><EstudioGenioPanel tenantId="tenant-1" caseId="case-1" /></QueryClientProvider>);
 return { ...result, client };
}
beforeEach(() => {
 studies = []; enabled = true; api.mockReset();
 api.mockImplementation(async (path, init) => {
  if (String(path).includes("/informe")) return response("<h1>Informe preparado</h1>");
  if (init?.method === "POST") return response({ estudio_id: "e1", estado: "en_curso", paquete: "esencial", ya_existia: false }, 202);
  return response({ habilitado: enabled, estudios: studies });
 });
});
afterEach(() => { jest.useRealTimers(); });
it("despacho no habilitado muestra aviso sin boton", async () => {
 enabled = false; renderPanel();
 expect(await screen.findByText(m.disabled)).toBeVisible();
 expect(screen.queryByRole("button", { name: m.request })).toBeNull();
});
it("Esencial envia paquete y pedido solo despues de confirmar", async () => {
 renderPanel(); await screen.findByRole("button", { name: m.request });
 fireEvent.click(screen.getByLabelText(m.packages.esencial));
 fireEvent.change(screen.getByLabelText(m.pedido), { target: { value: "Revisar la prueba" } });
 fireEvent.click(screen.getByRole("button", { name: m.request }));
 expect(api.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
 expect(screen.getByRole("group", { name: m.confirmRequest })).toHaveTextContent("US$500");
 fireEvent.click(screen.getByRole("button", { name: m.confirm }));
 await waitFor(() => expect(api).toHaveBeenCalledWith("/api/legal/cases/case-1/estudio-genio", expect.objectContaining({ method: "POST", body: JSON.stringify({ paquete: "esencial", pedido: "Revisar la prueba" }) })));
});
it("en curso muestra fases y hora, bloquea nuevo pedido y no imprime datos", async () => {
 studies = [study]; renderPanel();
 expect(await screen.findByText(m.waiting)).toBeVisible();
 expect(screen.getByRole("button", { name: m.request })).toBeDisabled();
 for (const phase of Object.values(m.phases)) expect(screen.getByText(phase)).toBeVisible();
 expect(screen.getByText(m.done)).toBeVisible();
 expect(document.querySelector("time")?.dateTime).toBe(study.fases[0].cuando);
 expect(screen.queryByText("no mostrar")).toBeNull();
});
it("completado muestra HTML aislado y PDF", async () => {
 studies = [{ ...study, estado: "completado", resultado: { secreto: "no mostrar" } }]; renderPanel();
 const iframe = await screen.findByTitle(m.report);
 expect(iframe).toHaveAttribute("sandbox", ""); expect(iframe.getAttribute("srcdoc")).toContain("<h1>Informe preparado</h1>");
 expect(screen.getByRole("button", { name: m.pdf })).toBeEnabled();
 expect(screen.queryByText("no mostrar")).toBeNull();
});
it("firma no envia sin firmante y envia decision y correcciones tras confirmar", async () => {
 studies = [{ ...study, estado: "completado" }]; renderPanel(); await screen.findByTitle(m.report);
 fireEvent.click(screen.getByRole("button", { name: m.approve }));
 expect(screen.getByText(m.required)).toBeVisible();
 expect(api.mock.calls.some(([path]) => String(path).endsWith("/revision"))).toBe(false);
 fireEvent.change(screen.getByLabelText(m.signer), { target: { value: "Ana Abogada" } });
 fireEvent.click(screen.getByRole("button", { name: m.addCorrection }));
 fireEvent.change(screen.getByLabelText(m.topic), { target: { value: "plazo" } });
 fireEvent.change(screen.getByLabelText(m.correction), { target: { value: "Revisar el plazo" } });
 fireEvent.click(screen.getByRole("button", { name: m.approve }));
 expect(api.mock.calls.some(([path]) => String(path).endsWith("/revision"))).toBe(false);
 fireEvent.click(screen.getByRole("button", { name: m.confirm }));
 await waitFor(() => expect(api).toHaveBeenCalledWith("/api/legal/cases/case-1/estudio-genio/e1/revision", expect.objectContaining({ method: "POST", body: JSON.stringify({ decision: "aprobado", firmante: "Ana Abogada", correcciones: [{ tema: "plazo", texto: "Revisar el plazo" }] }) })));
});
it("422 muestra mensaje de datos invalidos", async () => {
 api.mockResolvedValue(response({ detail: [{ msg: "invalid" }] }, 422)); renderPanel();
 expect(await screen.findByRole("alert")).toHaveTextContent(m.errors[422]);
});
it("403 no habilitado tambien bloquea cuando responde como error HTTP", async () => {
 api.mockResolvedValue(response({ detail: "ESTUDIO_GENIO_NO_HABILITADO" }, 403)); renderPanel();
 expect(await screen.findByText(m.disabled)).toBeVisible(); expect(screen.queryByRole("button")).toBeNull();
});
it("consulta a los 20 segundos y deja de consultar al terminar", async () => {
 jest.useFakeTimers(); studies = [study]; const rendered = renderPanel();
 await act(async () => { await jest.advanceTimersByTimeAsync(0); });
 expect(screen.getByText(m.waiting)).toBeVisible();
 const listCalls = () => api.mock.calls.filter(([path]) => String(path).endsWith("/estudio-genio")).length;
 const initial = listCalls(); studies = [{ ...study, estado: "completado" }];
 await act(async () => { await jest.advanceTimersByTimeAsync(20010); });
 expect(listCalls()).toBe(initial + 1); const finished = listCalls();
 await act(async () => { await jest.advanceTimersByTimeAsync(40000); });
 expect(listCalls()).toBe(finished); rendered.unmount(); rendered.client.clear();
});
it("cambiar historial carga el HTML del estudio elegido", async () => {
 studies = [{ ...study, estado: "completado" }, { ...study, estudio_id: "anterior", estado: "completado" }];
 renderPanel(); await screen.findByTitle(m.report);
 fireEvent.change(screen.getByLabelText(m.history), { target: { value: "anterior" } });
 await waitFor(() => expect(api).toHaveBeenCalledWith(expect.stringContaining("/anterior/informe?formato=html"), expect.anything()));
});
it("la lista descarta resultado y datos de las fases", async () => {
 studies = [{ ...study, resultado: { grande: "x" } }];
 const result = await listEstudios("tenant-1", "case-1");
 expect(result.estudios[0]).not.toHaveProperty("resultado"); expect(result.estudios[0].fases[0]).not.toHaveProperty("datos");
});

it("rechazo reemplaza revision previa solo despues de confirmar", async () => {
 studies = [{ ...study, estado: "completado", revision: { estado: "aprobado", firmante: "Ana", fecha: "2026-11-26T10:00:00Z", correcciones: [{ tema: "norma", texto: "Revisar" }] } }];
 renderPanel(); await screen.findByTitle(m.report);
 expect(screen.getByText(/Aprobado.*Ana/, { selector: "p" })).toBeVisible();
 fireEvent.click(screen.getByRole("button", { name: m.reject }));
 expect(api.mock.calls.some(([path]) => String(path).endsWith("/revision"))).toBe(false);
 fireEvent.click(screen.getByRole("button", { name: m.confirm }));
 await screen.findByText(m.saved);
 const call = api.mock.calls.find(([path]) => String(path).endsWith("/revision"));
 expect(JSON.parse(call[1].body)).toMatchObject({ decision: "rechazado", firmante: "Ana", correcciones: [{ tema: "norma", texto: "Revisar" }] });
});
it("422 al pedir muestra mensaje y permite reintentar", async () => {
 const original = api.getMockImplementation()!;
 api.mockImplementation((path, init) => init?.method === "POST" ? Promise.resolve(response({ detail: "invalid" }, 422)) : original(path, init));
 renderPanel(); fireEvent.click(await screen.findByRole("button", { name: m.request }));
 fireEvent.click(screen.getByRole("button", { name: m.confirm }));
 expect(await screen.findByRole("alert")).toHaveTextContent(m.errors[422]);
 expect(screen.getByRole("button", { name: m.request })).toBeEnabled();
});
