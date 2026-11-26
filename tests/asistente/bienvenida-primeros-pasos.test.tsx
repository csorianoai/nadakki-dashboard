/** Bienvenida de onboarding: "Primeros pasos: X de 6" en el panel del concesionario. */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { BienvenidaPrimerosPasos } from "@/components/ai/BienvenidaPrimerosPasos";
import { __reiniciarBienvenida, CLAVE_DATOS } from "@/lib/agents/contable/primeros-pasos-client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let token: string | null = "jwt-prueba";
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => token, getRefreshToken: () => null },
}));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

const PASOS = [
  { paso: "Cargar tus contactos (proveedores y compradores con DNI o CUIT)", hecho: true, cantidad: 3, enlace: "/autos/dealer/contactos" },
  { paso: "Tener un usuario para cada vendedor (pedile a Nadakki que los cree; uno por correo)", hecho: true, cantidad: 2, enlace: null },
  { paso: "Cargar tu primer auto con su compra", hecho: false, cantidad: 0, enlace: "/autos/dealer/inventario/nuevo" },
  { paso: "Pasar autos a Disponible para que se vean en tu portal", hecho: false, cantidad: 0, enlace: "/autos/dealer/inventario" },
  { paso: "Registrar tu primera venta (precio, IVA, comprador y forma de pago)", hecho: false, cantidad: 0, enlace: "/autos/dealer/inventario" },
  { paso: "Tener la direccion de tu portal publico (la configura Nadakki)", hecho: false, cantidad: 0, enlace: null },
];
const respuesta = (datos: unknown) => ({ response: "texto", links: [], herramienta: "primeros_pasos", datos, modo: "fijo", read_only: true });
const datosCon = (siguiente: unknown, completados = 2, pasos = PASOS) => ({ completados, total: 6, siguiente, pasos });

async function esperarPedido() {
  await waitFor(() => expect(apiFetchMock).toHaveBeenCalled());
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => {
  apiFetchMock.mockReset();
  window.sessionStorage.clear();
  __reiniciarBienvenida();
  token = "jwt-prueba";
});

describe("BienvenidaPrimerosPasos", () => {
  it("muestra 'Primeros pasos: 2 de 6', la lista y el siguiente paso con su enlace", async () => {
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(PASOS[2]))));
    render(<BienvenidaPrimerosPasos />);
    const region = await screen.findByRole("region", { name: /primeros pasos/i });
    expect(region).toHaveTextContent("Primeros pasos: 2 de 6");
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(screen.getAllByText(/^Hecho:/)).toHaveLength(2);
    const link = screen.getByRole("link", { name: /siguiente paso: cargar tu primer auto/i });
    expect(link.getAttribute("href")).toBe("/autos/dealer/inventario/nuevo");
    expect(apiFetchMock).toHaveBeenCalledWith("/api/assistant/contable/ia/chat", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(apiFetchMock.mock.calls[0][1].body)).toEqual({ message: "primeros pasos" });
  });

  it("con enlace null muestra el texto del paso y 'Pedíselo a Nadakki', sin enlace", async () => {
    const pasos = PASOS.map((p, i) => ({ ...p, hecho: i !== 5 }));
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(pasos[5], 5, pasos))));
    render(<BienvenidaPrimerosPasos />);
    const sin = await screen.findByTestId("bienvenida-sin-enlace");
    expect(sin).toHaveTextContent("Tener la direccion de tu portal publico");
    expect(sin).toHaveTextContent("Pedíselo a Nadakki");
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 5 de 6");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("un enlace fuera de la lista blanca se trata como null", async () => {
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon({ ...PASOS[2], enlace: "https://malo.example" }))));
    render(<BienvenidaPrimerosPasos />);
    expect(await screen.findByText(/Pedíselo a Nadakki/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("si está todo completo (siguiente null) no muestra nada", async () => {
    const pasos = PASOS.map((p) => ({ ...p, hecho: true }));
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(null, 6, pasos))));
    const { container } = render(<BienvenidaPrimerosPasos />);
    await esperarPedido();
    expect(container.innerHTML).toBe("");
  });

  it.each([
    ["HTTP 500", () => apiFetchMock.mockResolvedValue(ok({ detail: "error" }, 500))],
    ["excepción de red", () => apiFetchMock.mockRejectedValue(new Error("red"))],
    ["respuesta sin datos", () => apiFetchMock.mockResolvedValue(ok({ response: "hola", links: [], herramienta: null, datos: null }))],
    ["datos con forma rara", () => apiFetchMock.mockResolvedValue(ok(respuesta({ completados: "dos", pasos: "x" })))],
  ])("si el backend falla (%s) no muestra nada ni rompe", async (_n, preparar) => {
    preparar();
    const { container } = render(<BienvenidaPrimerosPasos />);
    await esperarPedido();
    expect(container.innerHTML).toBe("");
  });

  it("'Ahora no' la cierra y no vuelve a aparecer en la sesión", async () => {
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(PASOS[2]))));
    const { unmount } = render(<BienvenidaPrimerosPasos />);
    fireEvent.click(await screen.findByRole("button", { name: /ahora no/i }));
    expect(screen.queryByRole("region")).toBeNull();
    unmount();
    const otra = render(<BienvenidaPrimerosPasos />);
    await act(async () => { await Promise.resolve(); });
    expect(otra.container.innerHTML).toBe("");
    // Recarga de la pagina (memoria borrada): la marca sigue en sessionStorage.
    __reiniciarBienvenida();
    otra.unmount();
    const tercera = render(<BienvenidaPrimerosPasos />);
    await act(async () => { await Promise.resolve(); });
    expect(tercera.container.innerHTML).toBe("");
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("pide el avance una sola vez por sesión aunque se monte en varias pantallas", async () => {
    apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(PASOS[2]))));
    const a = render(<BienvenidaPrimerosPasos />);
    const b = render(<BienvenidaPrimerosPasos />);
    expect(await within(a.container).findByText("Primeros pasos: 2 de 6")).toBeInTheDocument();
    expect(await within(b.container).findByText("Primeros pasos: 2 de 6")).toBeInTheDocument();
    a.unmount(); b.unmount();
    // Recarga de la pagina: sale de sessionStorage, sin volver a pedir.
    __reiniciarBienvenida();
    expect(window.sessionStorage.getItem(CLAVE_DATOS)).not.toBeNull();
    render(<BienvenidaPrimerosPasos />);
    expect(await screen.findByText("Primeros pasos: 2 de 6")).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("sin sesión no pide nada ni muestra nada", async () => {
    token = null;
    const { container } = render(<BienvenidaPrimerosPasos />);
    await act(async () => { await Promise.resolve(); });
    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(container.innerHTML).toBe("");
  });

  it("si sessionStorage no está disponible, igual funciona sin romper", async () => {
    const espia = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    const espia2 = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    try {
      apiFetchMock.mockResolvedValue(ok(respuesta(datosCon(PASOS[2]))));
      render(<BienvenidaPrimerosPasos />);
      expect(await screen.findByText("Primeros pasos: 2 de 6")).toBeInTheDocument();
    } finally { espia.mockRestore(); espia2.mockRestore(); }
  });
});
