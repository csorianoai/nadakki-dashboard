/**
 * F4E-3-ASISTENTE-CONTABLE-UI: chat de solo lectura contra POST /api/assistant/contable/chat.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { AsistenteContable } from "@/components/ai/AsistenteContable";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

async function preguntar(texto: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: texto } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
}

beforeEach(() => apiFetchMock.mockReset());

describe("AsistenteContable", () => {
  it("pinta un enlace interno para una ruta de la lista blanca", async () => {
    apiFetchMock.mockResolvedValue(ok({ response: "Las finanzas estan aqui: /autos/dealer/finanzas", links: ["/autos/dealer/finanzas"] }));
    render(<AsistenteContable />);
    await preguntar("Donde veo finanzas?");
    const a = await screen.findByRole("link", { name: /\/autos\/dealer\/finanzas/ });
    expect(a.getAttribute("href")).toBe("/autos/dealer/finanzas");
  });

  it("acepta la query del enlace de reparaciones", async () => {
    apiFetchMock.mockResolvedValue(ok({ response: "Ve a: /autos/dealer/finanzas?vehiculo=ID", links: [] }));
    render(<AsistenteContable />);
    await preguntar("Como cargo una reparacion?");
    expect((await screen.findByRole("link")).getAttribute("href")).toBe("/autos/dealer/finanzas?vehiculo=ID");
  });

  it("no pinta enlaces para URLs externas ni javascript:", async () => {
    apiFetchMock.mockResolvedValue(ok({
      response: "Mira https://ejemplo.com y javascript:alert(1) y /autos/dealer/otra",
      links: ["https://ejemplo.com", "javascript:alert(1)"],
    }));
    const { container } = render(<AsistenteContable />);
    await preguntar("hola");
    await screen.findByText(/https:\/\/ejemplo\.com/);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("javascript:alert(1)");
  });

  it("muestra <script> como texto", async () => {
    apiFetchMock.mockResolvedValue(ok({ response: "<script>alert(1)</script>", links: [] }));
    const { container } = render(<AsistenteContable />);
    await preguntar("hola");
    await screen.findByText(/<script>alert\(1\)<\/script>/);
    expect(container.querySelector("script")).toBeNull();
  });

  it("404 muestra el aviso de no disponible con reintento", async () => {
    apiFetchMock.mockResolvedValue(ok({}, 404));
    render(<AsistenteContable />);
    await preguntar("hola");
    expect(await screen.findByText(/El asistente todavia no esta disponible/)).toBeTruthy();
    apiFetchMock.mockResolvedValue(ok({ response: "Hola", links: [] }));
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText("Hola")).toBeTruthy();
    expect(screen.queryByText(/todavia no esta disponible/)).toBeNull();
  });

  it("error de red muestra el aviso", async () => {
    apiFetchMock.mockRejectedValue(new Error("red"));
    render(<AsistenteContable />);
    await preguntar("hola");
    expect(await screen.findByText(/El asistente todavia no esta disponible/)).toBeTruthy();
  });

  it("solo hace POST a /api/assistant/contable/chat con {message}", async () => {
    apiFetchMock.mockResolvedValue(ok({ response: "ok", links: [] }));
    render(<AsistenteContable />);
    fireEvent.click(screen.getByRole("button", { name: "Donde registro una compra?" }));
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = apiFetchMock.mock.calls[0];
    expect(url).toBe("/api/assistant/contable/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ message: "Donde registro una compra?" });
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
  });

  it("ofrece las preguntas sugeridas, region aria-live y ningun boton de escritura", () => {
    const { container } = render(<AsistenteContable />);
    for (const q of ["Como cargo una reparacion?", "Donde registro una compra?", "Como doy de alta un contacto?"]) {
      expect(screen.getByRole("button", { name: q })).toBeTruthy();
    }
    expect(container.querySelector("[aria-live]")).not.toBeNull();
    expect(screen.queryByRole("button", { name: /crear|editar|borrar|eliminar/i })).toBeNull();
  });
});
