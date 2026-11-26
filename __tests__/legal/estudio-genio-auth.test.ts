import { descargarEstudio, informeEstudio, listEstudios } from "@/lib/legal/cases/estudio-genio-api";
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "jwt-genio" } }));
jest.mock("@/lib/auth/token-refresh", () => ({ isTokenExpiringSoon: () => false, refreshAccessToken: jest.fn() }));
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); jest.useRealTimers(); });
it("lista con JWT y tenant usando el mismo apiFetch de Legal", async () => {
 const request = jest.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ habilitado: true, estudios: [] }) });
 global.fetch = request;
 await listEstudios("tenant-a", "case /1");
 expect(request.mock.calls[0][0]).toBe("/api/legal/cases/case%20%2F1/estudio-genio");
 const init = request.mock.calls[0][1]; expect(init.headers.get("Authorization")).toBe("Bearer jwt-genio"); expect(init.headers.get("X-Tenant-ID")).toBe("tenant-a");
});
it("PDF se obtiene con autenticacion y se descarga por blob, no por URL del backend", async () => {
 jest.useFakeTimers();
 const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
 const request = jest.fn().mockResolvedValue({ ok: true, blob: async () => blob }); global.fetch = request;
 const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
 URL.createObjectURL = jest.fn(() => "blob:genio"); URL.revokeObjectURL = jest.fn();
 const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function(this: HTMLAnchorElement) {
  expect(this.getAttribute("href")).toBe("blob:genio"); expect(this.download).toBe("estudio-genio-e1.pdf");
 });
 try {
  await descargarEstudio("tenant-a", "case-1", "e1");
  expect(request.mock.calls[0][0]).toBe("/api/legal/cases/case-1/estudio-genio/e1/informe?formato=pdf");
  expect(request.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer jwt-genio");
  expect(request.mock.calls[0][1].headers.get("X-Tenant-ID")).toBe("tenant-a");
  expect(click).toHaveBeenCalledTimes(1); expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  jest.advanceTimersByTime(1000); expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:genio");
 } finally { URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke; }
});
it.each([403, 409, 422])("conserva HTTP %s para los helpers legales", async (status) => {
 global.fetch = jest.fn().mockResolvedValue({ ok: false, status, text: async () => JSON.stringify({ detail: "fallo" }) });
 await expect(informeEstudio("t", "c", "e", "html")).rejects.toMatchObject({ status, detail: "fallo" });
});
