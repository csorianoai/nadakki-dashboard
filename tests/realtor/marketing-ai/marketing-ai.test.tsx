import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MarketingAiPanel } from "@/components/realtor/marketing-ai/MarketingAiPanel";
import { DEMO_SUMMARIES } from "@/lib/realtor/marketing-ai/demo";
import { GATEWAYS } from "@/lib/realtor/marketing-ai/gateways";
import { REALTOR_CENTERS } from "@/lib/realtor/centers";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
const on = (demo: boolean) => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  if (demo) process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
};

describe("datos", () => {
  it("las puertas apuntan al core de Marketing y cada una tiene resumen sintético", () => {
    expect(GATEWAYS.map((g) => g.href)).toEqual(["/marketing/campaigns", "/marketing/templates", "/marketing/social", "/marketing/social-connections"]);
    expect(DEMO_SUMMARIES.map((s) => s.id)).toEqual(GATEWAYS.map((g) => g.id));
    DEMO_SUMMARIES.forEach((s) => s.items.forEach((i) => expect(i.es).toMatch(/^SYNTH/)));
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "marketing-ai")?.href).toBe("/realtor/marketing-ai");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, resúmenes y enlaces; solo llama a /acceso sin tenant", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<MarketingAiPanel />);
    expect(await screen.findByTestId("marketing-ai-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getByTestId("summary-campaigns")).toHaveTextContent("2 activas");
    expect(screen.getByTestId("open-templates")).toHaveAttribute("href", "/marketing/templates");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByTestId("summary-campaigns")).toHaveTextContent("2 active");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras, resúmenes ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<MarketingAiPanel />);
    expect(await screen.findByTestId("marketing-ai-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("summary-campaigns")).toBeNull();
    expect(screen.getByTestId("marketing-ai-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<MarketingAiPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("marketing-ai-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<MarketingAiPanel />);
    await screen.findByTestId("marketing-ai-empty");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("marketing-ai-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("apagado: no pregunta al backend", () => {
    render(<MarketingAiPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
