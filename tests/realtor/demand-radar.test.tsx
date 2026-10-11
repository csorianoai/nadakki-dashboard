import fs from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";
import { DemandRadarPanel } from "@/components/realtor/DemandRadarPanel";
import { isDemoAllowed, isPanelFlagOn, isProductionEnv } from "@/lib/realtor/config";
import { DATA_STATUSES } from "@/lib/realtor/types";
import { buildDemoDataset, PILOT_FILTERS } from "@/lib/realtor/demo-data";

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
    expect(isPanelFlagOn({})).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_DEMAND_RADAR: "true" })).toBe(false);
  });

  it("positivo: flag on + 200 muestra el panel con filtros y aviso de señales", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    process.env.NEXT_PUBLIC_APP_ENV = "local";
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

describe("tenant ajeno: el cliente nunca envía tenant", () => {
  it("el backend responde 403 a un tenant sin acceso y la solicitud no lleva tenant", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    setAccess(403);
    const { container } = render(<DemandRadarPanel />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(container).toBeEmptyDOMElement();
  });

  it("ningún archivo del módulo menciona tenant_id ni cabeceras de tenant", () => {
    const roots = ["lib/realtor", "components/realtor", "app/realtor"];
    const files: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p) : files.push(p);
    });
    roots.forEach((r) => walk(path.join(process.cwd(), r)));
    expect(files.length).toBeGreaterThan(5);
    files.forEach((f) => expect(fs.readFileSync(f, "utf8")).not.toMatch(/tenant/i));
  });
});

describe("DEMO nunca en producción", () => {
  it("positivo: con opt-in y fuera de producción se rotula DEMO con banner", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    process.env.NEXT_PUBLIC_APP_ENV = "local";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demo-banner")).toBeInTheDocument();
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges).toContain("DEMO");
    badges.forEach((b) => expect(DATA_STATUSES).toContain(b));
  });

  it("negativo: en producción, aun con opt-in, no hay DEMO y todo es UNAVAILABLE", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    setAccess(200);
    render(<DemandRadarPanel />);
    await screen.findByTestId("demand-radar-panel");
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.every((b) => b === "UNAVAILABLE")).toBe(true);
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(isProductionEnv({ NEXT_PUBLIC_APP_ENV: "production" })).toBe(true);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1" })).toBe(false);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1", NEXT_PUBLIC_APP_ENV: "staging" })).toBe(false);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1", NEXT_PUBLIC_APP_ENV: "preview" })).toBe(true);
    expect(isDemoAllowed({ NEXT_PUBLIC_APP_ENV: "local" })).toBe(false);
  });
});

describe("contenido de señales y Fair Housing", () => {
  it("cada señal trae tipo, fuente, fecha y estado válido", () => {
    const { signals } = buildDemoDataset(PILOT_FILTERS);
    expect(signals.length).toBeGreaterThan(0);
    signals.forEach((s) => {
      expect(s.signalType).toBeTruthy();
      expect(s.source).toBeTruthy();
      expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(DATA_STATUSES).toContain(s.status);
    });
  });

  it("negativo: fuera del piloto no se inventan cifras (UNAVAILABLE sin puntos)", () => {
    const { signals } = buildDemoDataset({ ...PILOT_FILTERS, city: "Otra ciudad" });
    signals.forEach((s) => { expect(s.status).toBe("UNAVAILABLE"); expect(s.points).toHaveLength(0); });
  });

  it("los filtros y datos no contienen atributos de personas ni nacionalidad", () => {
    const keys = Object.keys(PILOT_FILTERS).join(" ");
    expect(keys).not.toMatch(/national|origin|origen|nacionalidad|race|religion|familial|disab/i);
    expect(JSON.stringify(buildDemoDataset(PILOT_FILTERS))).not.toMatch(/nacionalidad|nationality|buyer_profile/i);
  });

  it("muestra la nota de Fair Housing y filtra por operación", async () => {
    process.env.NEXT_PUBLIC_REALTOR_DEMAND_RADAR = "on";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByText(/Fair Housing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Operación")).toHaveValue("venta");
  });
});
