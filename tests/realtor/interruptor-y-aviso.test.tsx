import { act, render, screen, waitFor } from "@testing-library/react";
import { DemandRadarPanel } from "@/components/realtor/DemandRadarPanel";
import { RealtorHome } from "@/components/realtor/RealtorHome";
import { isPanelFlagOn } from "@/lib/realtor/config";

/**
 * Medido en producción (2026-10-12): Vercel tiene NEXT_PUBLIC_REALTOR_PANEL=1 y el código solo leía
 * NEXT_PUBLIC_REALTOR_DEMAND_RADAR=on. El panel devolvía null sin llamar a /acceso: pantalla en blanco.
 * Contrato nuevo: nunca en blanco; sin acceso, un aviso con el motivo y sin datos.
 */
const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const ENV_KEYS = ["NEXT_PUBLIC_REALTOR_PANEL", "NEXT_PUBLIC_REALTOR_DEMAND_RADAR", "NEXT_PUBLIC_REALTOR_ALLOW_DEMO", "NEXT_PUBLIC_APP_ENV"];
beforeEach(() => { mockApiFetch.mockReset(); ENV_KEYS.forEach((k) => delete process.env[k]); });

const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await mockApiFetch.mock.results[0].value.catch(() => undefined); await new Promise((r) => setTimeout(r, 0)); });
};

describe("interruptor: el nombre configurado en Vercel enciende el panel", () => {
  it("NEXT_PUBLIC_REALTOR_PANEL=1 enciende; otros valores no", () => {
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "1" })).toBe(true);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "0" })).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "true" })).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_DEMAND_RADAR: "on" })).toBe(true);
  });

  it("con NEXT_PUBLIC_REALTOR_PANEL=1 y 200 llama a /acceso y pinta el panel", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demand-radar-panel")).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/acceso", expect.objectContaining({ method: "GET" }));
  });
});

describe("nunca en blanco: aviso con el motivo y sin datos", () => {
  it("interruptor apagado: aviso 'apagado' y no pregunta al backend", () => {
    const { container } = render(<DemandRadarPanel />);
    const aviso = screen.getByTestId("realtor-notice");
    expect(aviso).toHaveAttribute("data-reason", "apagado");
    expect(container).not.toBeEmptyDOMElement();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("mientras comprueba: aviso 'comprobando', nunca vacío", () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockReturnValue(new Promise(() => undefined));
    render(<DemandRadarPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "comprobando");
  });

  it.each([401, 403, 404])("%s: aviso 'sin-acceso' sin panel ni filtros", async (status) => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status });
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso");
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(screen.queryByLabelText("País")).toBeNull();
  });

  it.each([500, 502])("%s: aviso 'error'", async (status) => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status });
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "error");
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
  });

  it("error de red: aviso 'error'", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockRejectedValue(new Error("red"));
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "error");
  });
});

describe("página de inicio /realtor", () => {
  it("con 200 enlaza a Demand Radar", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<RealtorHome />);
    const link = await screen.findByRole("link", { name: /Demand Radar/ });
    expect(link).toHaveAttribute("href", "/realtor/demand-radar");
  });

  it("sin acceso: aviso y ningún enlace", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status: 403 });
    render(<RealtorHome />);
    await settle();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso");
    expect(screen.queryByRole("link")).toBeNull();
  });
});
