import { render, screen, waitFor } from "@testing-library/react";
import { DemandRadarPanel } from "@/components/realtor/DemandRadarPanel";
import { DATA_STATUSES } from "@/lib/realtor/types";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const ENV_KEYS = ["NEXT_PUBLIC_REALTOR_DEMAND_RADAR", "NEXT_PUBLIC_REALTOR_ALLOW_DEMO", "NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_APP_ENV"];
beforeEach(() => { mockApiFetch.mockReset(); ENV_KEYS.forEach((k) => delete process.env[k]); });
const setAccess = (status: number) => mockApiFetch.mockResolvedValue({ status });

describe("interruptor fail-closed", () => {
  it("apagado por defecto: no pregunta al backend ni muestra nada", () => {
    setAccess(200);
    const { container } = render(<DemandRadarPanel />);
    expect(container).toBeEmptyDOMElement();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("positivo: flag on + 200 muestra el panel con filtros y aviso de señales", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demand-radar-panel")).toBeInTheDocument();
    ["País", "Región", "Ciudad", "Zona", "Código postal", "Operación"].forEach((l) => expect(screen.getByLabelText(l)).toBeInTheDocument());
    expect(screen.getByText(/no certezas/)).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/acceso", expect.objectContaining({ method: "GET" }));
  });

  it.each([401, 403, 404, 500])("negativo: %s oculta el panel", async (status) => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    setAccess(status);
    const { container } = render(<DemandRadarPanel />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("negativo: error de red oculta el panel", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    mockApiFetch.mockRejectedValue(new Error("red"));
    const { container } = render(<DemandRadarPanel />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("tenant ajeno", () => {
  it("403 de un tenant sin acceso: la solicitud no lleva tenant y no se pinta nada", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    setAccess(403);
    const { container } = render(<DemandRadarPanel />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DEMO nunca en producción", () => {
  it("positivo: con opt-in y fuera de producción se rotula DEMO con banner", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demo-banner")).toBeInTheDocument();
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges).toContain("DEMO");
    badges.forEach((b) => expect(DATA_STATUSES).toContain(b));
  });

  it("negativo: en producción, aun con opt-in, todo es UNAVAILABLE y sin banner", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    setAccess(200);
    render(<DemandRadarPanel />);
    await screen.findByTestId("demand-radar-panel");
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.every((b) => b === "UNAVAILABLE")).toBe(true);
    expect(screen.queryByTestId("demo-banner")).toBeNull();
  });
});

describe("Fair Housing", () => {
  it("muestra la nota de Fair Housing y filtra por operación", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByText(/Fair Housing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Operación")).toHaveValue("venta");
  });
});
