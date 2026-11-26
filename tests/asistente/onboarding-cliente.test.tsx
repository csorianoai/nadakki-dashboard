/** Motor de onboarding en el panel: cliente por core (GET del motor, respaldo al chat, cache por core+tenant, eventos). */
import { act } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { CONFIG_CORES, enlaceBajo } from "@/lib/agents/onboarding/cores";
import {
  ANTIRREBOTE_MS, clientePrimerosPasos, crearClientePrimerosPasos, esCoreNoActivo, rutaPrimerosPasos, tenantActual,
} from "@/lib/agents/onboarding/primeros-pasos-client";
import { avisarProgreso, coreDelEvento } from "@/lib/agents/onboarding/progreso";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let token: string | null = null;
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => token, getRefreshToken: () => null },
}));
const apiFetchMock = apiFetch as jest.Mock;
const resp = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
const jwt = (tid: string) => `h.${btoa(JSON.stringify({ tenant_id: tid }))}.f`;

const PASOS_LEGAL = [
  { clave: "abogados", paso: "Tener un usuario para cada abogado", hecho: true, cantidad: 2, enlace: null, opcional: false },
  { clave: "expediente", paso: "Crear tu primer expediente", hecho: false, cantidad: 0, enlace: "/legal/cases/new", opcional: false },
  { clave: "audiencia", paso: "Agendar una audiencia o un plazo", hecho: false, cantidad: 0, enlace: "/autos/dealer/leads", opcional: true },
];
const legal = (completados = 1, siguiente: unknown = PASOS_LEGAL[1]) =>
  ({ core: "legal", titulo: "Primeros pasos del despacho", completados, total: 5, siguiente, pasos: PASOS_LEGAL });
const chatAutos = { herramienta: "primeros_pasos", datos: { completados: 0, total: 6, siguiente: null, pasos: [] } };

async function vaciar() {
  await act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
}

beforeEach(() => {
  apiFetchMock.mockReset();
  window.sessionStorage.clear();
  clientePrimerosPasos("legal").__reiniciar();
  clientePrimerosPasos("autos").__reiniciar();
  token = jwt("t-uno");
});

describe("transporte get-con-respaldo (Autos cuando el GET esté desplegado)", () => {
  const cliente = () => crearClientePrimerosPasos({ ...CONFIG_CORES.autos, transporte: "get-con-respaldo" });

  it("404 de ruta inexistente: cae al chat de hoy", async () => {
    apiFetchMock.mockResolvedValueOnce(resp({ detail: "Not Found" }, 404)).mockResolvedValueOnce(resp(chatAutos));
    const d = await cliente().obtener();
    expect(d?.total).toBe(6);
    expect(apiFetchMock.mock.calls.map((c) => c[0])).toEqual([rutaPrimerosPasos("autos"), "/api/assistant/contable/ia/chat"]);
  });

  it("404 CORE_NO_ACTIVO: no cae al chat, no hay tarjeta", async () => {
    apiFetchMock.mockResolvedValue(resp({ detail: { error: "CORE_NO_ACTIVO" } }, 404));
    expect(await cliente().obtener()).toBeNull();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("GET disponible: usa el motor y no el chat", async () => {
    apiFetchMock.mockResolvedValue(resp({ core: "autos", completados: 1, total: 6, siguiente: null, pasos: [] }));
    expect((await cliente().obtener())?.completados).toBe(1);
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("reconoce CORE_NO_ACTIVO en detail, detail.error, detail.code, error y code", () => {
    for (const b of [{ detail: "CORE_NO_ACTIVO" }, { detail: { code: "CORE_NO_ACTIVO" } }, { error: "CORE_NO_ACTIVO" }, { code: "CORE_NO_ACTIVO" }]) {
      expect(esCoreNoActivo(b)).toBe(true);
    }
    expect(esCoreNoActivo({ detail: "Not Found" })).toBe(false);
    expect(esCoreNoActivo(null)).toBe(false);
  });
});

describe("cache por core y tenant", () => {
  it("enlaces: solo rutas internas bajo /legal", () => {
    expect(enlaceBajo(["/legal"], "/legal")).toBe("/legal");
    expect(enlaceBajo(["/legal"], "/legal/cases?x=1")).toBe("/legal/cases?x=1");
    expect(enlaceBajo(["/legal"], "/legalx")).toBeNull();
    expect(enlaceBajo(["/legal"], "https://malo.example/legal")).toBeNull();
    expect(enlaceBajo(["/legal"], "//malo.example")).toBeNull();
  });

  it("tenant del JWT; otro tenant en la misma pestaña vuelve a pedir y no ve el avance anterior", async () => {
    expect(tenantActual()).toBe("t-uno");
    apiFetchMock.mockResolvedValueOnce(resp(legal(1))).mockResolvedValueOnce(resp(legal(3)));
    const c = clientePrimerosPasos("legal");
    expect((await c.obtener())?.completados).toBe(1);
    expect(window.sessionStorage.getItem("nadakki.onboarding.legal.t-uno.v2")).not.toBeNull();
    expect((await c.obtener())?.completados).toBe(1);
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    token = jwt("t-dos");
    expect((await c.obtener())?.completados).toBe(3);
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it("Autos guarda el tenant dentro del dato: el de otro tenant no se usa", async () => {
    window.sessionStorage.setItem(CONFIG_CORES.autos.claveDatos(""), JSON.stringify({ ...chatAutos.datos, _t: "otro" }));
    apiFetchMock.mockResolvedValue(resp(chatAutos));
    await clientePrimerosPasos("autos").obtener();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("'Ahora no' es por core: cerrar Legal no cierra Autos", () => {
    clientePrimerosPasos("legal").cerrar(1);
    expect(clientePrimerosPasos("legal").cerrada()).toBe(true);
    expect(clientePrimerosPasos("autos").cerrada()).toBe(false);
  });
});

describe("evento nadakki:progreso por core", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("'legal.<evento>' refresca Legal y no Autos; sin core refresca a todos", async () => {
    expect(coreDelEvento({ motivo: "legal.expediente-creado" })).toBe("legal");
    expect(coreDelEvento({ motivo: "auto-cargado" })).toBeNull();
    expect(coreDelEvento({ motivo: "x", core: "autos" })).toBe("autos");
    apiFetchMock.mockImplementation(async (ruta: string) => (ruta.includes("legal") ? resp(legal()) : resp(chatAutos)));
    const quitarL = clientePrimerosPasos("legal").suscribir(() => {});
    const quitarA = clientePrimerosPasos("autos").suscribir(() => {});
    try {
      act(() => avisarProgreso("legal.expediente-creado"));
      await act(async () => { jest.advanceTimersByTime(ANTIRREBOTE_MS); });
      await vaciar();
      expect(apiFetchMock.mock.calls.map((c) => c[0])).toEqual([rutaPrimerosPasos("legal")]);
      act(() => avisarProgreso("auto-cargado"));
      await act(async () => { jest.advanceTimersByTime(ANTIRREBOTE_MS); });
      await vaciar();
      expect(apiFetchMock).toHaveBeenCalledTimes(3);
    } finally { quitarL(); quitarA(); }
  });
});
