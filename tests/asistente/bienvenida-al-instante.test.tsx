/** La bienvenida "Primeros pasos: X de 6" se actualiza al instante cuando el concesionario avanza. */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { BienvenidaPrimerosPasos, LISTO_VISIBLE_MS } from "@/components/ai/BienvenidaPrimerosPasos";
import {
  __reiniciarBienvenida,
  ANTIRREBOTE_MS,
  CLAVE_DATOS,
  REFRESCO_AL_VOLVER_MS,
} from "@/lib/agents/contable/primeros-pasos-client";
import { avisarProgreso } from "@/lib/dealer/pasos-tarea";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let token: string | null = "jwt-prueba";
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => token, getRefreshToken: () => null },
}));
const apiFetchMock = apiFetch as jest.Mock;
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

const TITULOS = [
  "Cargar tus contactos",
  "Tener un usuario para cada vendedor",
  "Cargar tu primer auto con su compra",
  "Pasar autos a Disponible",
  "Registrar tu primera venta",
  "Tener la direccion de tu portal publico",
];
/** Respuesta del asistente con `n` pasos hechos de 6. */
function conHechos(n: number) {
  const pasos = TITULOS.map((paso, i) => ({ paso, hecho: i < n, cantidad: i < n ? 1 : 0, enlace: "/autos/dealer/inventario" }));
  return ok({ response: "t", links: [], herramienta: "primeros_pasos", datos: { completados: n, total: 6, siguiente: pasos[n] ?? null, pasos } });
}

async function vaciar() {
  await act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); });
}
async function pasar(ms: number) {
  await act(async () => { jest.advanceTimersByTime(ms); });
  await vaciar();
}
function ponerVisibilidad(estado: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => estado });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  jest.useFakeTimers();
  apiFetchMock.mockReset();
  window.sessionStorage.clear();
  __reiniciarBienvenida();
  token = "jwt-prueba";
});
afterEach(() => {
  jest.useRealTimers();
});

describe("bienvenida al instante", () => {
  it("el evento nadakki:progreso olvida el cache y vuelve a pedir: 2 de 6 pasa a 3 de 6", async () => {
    apiFetchMock.mockResolvedValueOnce(conHechos(2)).mockResolvedValueOnce(conHechos(3));
    render(<BienvenidaPrimerosPasos />);
    await vaciar();
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 2 de 6");

    act(() => avisarProgreso("auto-cargado"));
    expect(window.sessionStorage.getItem(CLAVE_DATOS)).not.toBeNull(); // aun dentro del antirrebote
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 3 de 6");
    expect(JSON.parse(window.sessionStorage.getItem(CLAVE_DATOS) as string).completados).toBe(3);
  });

  it("varias señales seguidas hacen una sola petición", async () => {
    apiFetchMock.mockResolvedValueOnce(conHechos(2)).mockResolvedValue(conHechos(4));
    render(<BienvenidaPrimerosPasos />);
    await vaciar();
    act(() => {
      avisarProgreso("auto-cargado");
      avisarProgreso("auto-publicado");
    });
    await pasar(ANTIRREBOTE_MS / 2);
    act(() => avisarProgreso("factura-cargada"));
    await pasar(ANTIRREBOTE_MS / 2);
    expect(apiFetchMock).toHaveBeenCalledTimes(1); // el antirrebote volvio a empezar
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 4 de 6");
  });

  it("al volver a la pestaña con menos de 60 s desde la última lectura no pide; con más, sí", async () => {
    apiFetchMock.mockResolvedValueOnce(conHechos(2)).mockResolvedValue(conHechos(3));
    render(<BienvenidaPrimerosPasos />);
    await vaciar();
    await pasar(REFRESCO_AL_VOLVER_MS - 5000);
    act(() => ponerVisibilidad("visible"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    await pasar(10_000);
    act(() => ponerVisibilidad("hidden"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(1); // ocultarse no pide
    act(() => ponerVisibilidad("visible"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 3 de 6");
  });

  it("'Ahora no' + avance igual sigue cerrada; si sube el número de pasos hechos, se reabre", async () => {
    apiFetchMock
      .mockResolvedValueOnce(conHechos(2))
      .mockResolvedValueOnce(conHechos(2))
      .mockResolvedValueOnce(conHechos(3));
    render(<BienvenidaPrimerosPasos />);
    await vaciar();
    fireEvent.click(screen.getByRole("button", { name: /ahora no/i }));
    expect(screen.queryByRole("region")).toBeNull();

    act(() => avisarProgreso("contacto-editado"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("region")).toBeNull();

    act(() => avisarProgreso("auto-cargado"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 3 de 6");
  });

  it("al llegar a 6 de 6 muestra una vez '¡Listo!' y luego desaparece por la sesión", async () => {
    apiFetchMock.mockResolvedValueOnce(conHechos(5)).mockResolvedValue(conHechos(6));
    const { container, unmount } = render(<BienvenidaPrimerosPasos />);
    await vaciar();
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 5 de 6");

    act(() => avisarProgreso("portal-configurado"));
    await pasar(ANTIRREBOTE_MS);
    expect(screen.getByTestId("bienvenida-listo")).toHaveTextContent("¡Listo! Completaste los primeros pasos.");
    await pasar(LISTO_VISIBLE_MS);
    expect(container.innerHTML).toBe("");

    // Otra señal u otra pantalla: no vuelve a aparecer.
    act(() => avisarProgreso("otra-cosa"));
    await pasar(ANTIRREBOTE_MS);
    expect(container.innerHTML).toBe("");
    unmount();
    __reiniciarBienvenida(); // recarga de la pagina
    const otra = render(<BienvenidaPrimerosPasos />);
    await vaciar();
    expect(otra.container.innerHTML).toBe("");
  });

  it("sin sesión la señal no pide; un error al refrescar deja los últimos datos buenos", async () => {
    apiFetchMock.mockResolvedValueOnce(conHechos(2)).mockRejectedValueOnce(new Error("red"));
    render(<BienvenidaPrimerosPasos />);
    await vaciar();
    act(() => avisarProgreso("auto-cargado"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 2 de 6");

    token = null;
    act(() => avisarProgreso("auto-cargado"));
    await pasar(ANTIRREBOTE_MS);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it("con sessionStorage bloqueado la señal igual refresca sin romper", async () => {
    const g = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("bloqueado"); });
    const s = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    const r = jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("bloqueado"); });
    try {
      apiFetchMock.mockResolvedValueOnce(conHechos(2)).mockResolvedValueOnce(conHechos(3));
      render(<BienvenidaPrimerosPasos />);
      await vaciar();
      act(() => avisarProgreso("auto-cargado"));
      await pasar(ANTIRREBOTE_MS);
      expect(screen.getByRole("region")).toHaveTextContent("Primeros pasos: 3 de 6");
    } finally { g.mockRestore(); s.mockRestore(); r.mockRestore(); }
  });
});
