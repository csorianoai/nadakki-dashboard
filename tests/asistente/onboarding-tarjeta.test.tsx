/** Motor de onboarding en el panel: tarjeta generica (variante en linea de Legal) y PasosDeTarea generico. */
import { act, render, screen } from "@testing-library/react";

import { apiFetch } from "@/lib/api/fetch-client";
import { BienvenidaPrimerosPasos } from "@/components/ai/onboarding/BienvenidaPrimerosPasos";
import { PasosDeTarea, resumenPasos } from "@/components/ai/onboarding/PasosDeTarea";
import { clientePrimerosPasos } from "@/lib/agents/onboarding/primeros-pasos-client";

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

async function vaciar() {
  await act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
}

beforeEach(() => {
  apiFetchMock.mockReset();
  window.sessionStorage.clear();
  clientePrimerosPasos("legal").__reiniciar();
  token = jwt("t-uno");
});

describe("tarjeta de Legal (GET del motor)", () => {
  it("pide GET /api/v1/onboarding/legal/primeros-pasos y muestra título, opcionales y enlaces de /legal", async () => {
    apiFetchMock.mockResolvedValue(resp(legal()));
    render(<BienvenidaPrimerosPasos core="legal" variante="en-linea" />);
    const region = await screen.findByRole("region", { name: /primeros pasos/i });
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith("/api/v1/onboarding/legal/primeros-pasos", { method: "GET" });
    expect(region).toHaveTextContent("Primeros pasos del despacho: 1 de 5");
    expect(region).toHaveTextContent("arrancar con tu despacho");
    expect(region).toHaveAttribute("data-core", "legal");
    expect(region.className).not.toMatch(/shadow-lg/);
    expect(screen.getByText(/Agendar una audiencia/)).toHaveTextContent("(opcional)");
    expect(screen.getByText(/^Opcional:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /siguiente paso: crear tu primer expediente/i })).toHaveAttribute("href", "/legal/cases/new");
  });

  it.each([
    ["404 CORE_NO_ACTIVO", resp({ detail: "CORE_NO_ACTIVO" }, 404)],
    ["404 de ruta inexistente", resp({ detail: "Not Found" }, 404)],
    ["500", resp({ detail: "x" }, 500)],
    ["respuesta de otro core", resp({ ...legal(), core: "autos" })],
  ])("con %s no muestra nada y no cae al chat", async (_n, r) => {
    apiFetchMock.mockResolvedValue(r);
    const { container } = render(<BienvenidaPrimerosPasos core="legal" variante="en-linea" />);
    await vaciar();
    expect(container.innerHTML).toBe("");
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

});

describe("PasosDeTarea genérico", () => {
  it("presenta pasos y usa las variables --onb-* con los colores del concesionario por defecto", () => {
    const pasos = [
      { id: "a", titulo: "Crear expediente", hecho: true },
      { id: "b", titulo: "Subir documento", hecho: false, enlace: "/legal/cases" },
      { id: "c", titulo: "Audiencia", hecho: false, opcional: true },
    ];
    expect(resumenPasos(pasos)).toMatchObject({ hechos: 1, total: 2 });
    render(<PasosDeTarea titulo="Expediente" pasos={pasos} />);
    expect(screen.getByRole("region", { name: "Expediente" })).toHaveTextContent("Expediente: 1 de 2");
    const link = screen.getByRole("link", { name: /siguiente paso: subir documento/i });
    expect(link.className).toContain("bg-[var(--onb-primary,var(--dcc-navy))]");
  });

  it("cada paso pendiente con enlace es un enlace de texto tocable (44 px); los hechos y los sin enlace no", () => {
    const pasos = [
      { id: "a", titulo: "Crear expediente", hecho: true, enlace: "/legal/cases/new" },
      { id: "b", titulo: "Subir documento", hecho: false, enlace: "/legal/cases" },
      { id: "c", titulo: "Agendar audiencia", hecho: false, enlace: "/legal/audiencias", opcional: true },
      { id: "d", titulo: "Revisar aquí", hecho: false },
    ];
    render(<PasosDeTarea titulo="Expediente" pasos={pasos} />);
    expect(screen.queryByTestId("paso-enlace-a")).toBeNull();
    expect(screen.queryByTestId("paso-enlace-d")).toBeNull();
    const b = screen.getByTestId("paso-enlace-b");
    expect(b).toHaveAttribute("href", "/legal/cases");
    expect(b.className).toContain("min-h-11");
    expect(b.className).toContain("font-semibold"); // es el siguiente
    expect(b.className).toContain("focus:outline-[var(--onb-accent,var(--dcc-teal))]");
    const c = screen.getByTestId("paso-enlace-c");
    expect(c).toHaveTextContent("Agendar audiencia (opcional)");
    expect(c.className).not.toContain("font-semibold");
    expect(screen.getByRole("link", { name: /siguiente paso: subir documento/i })).toHaveAttribute("href", "/legal/cases");
  });
});
