import fs from "fs";
import path from "path";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import { DemandRadarPanel } from "@/components/realtor/DemandRadarPanel";
import { isDemoAllowed, isPanelFlagOn } from "@/lib/realtor/config";
import { DATA_STATUSES } from "@/lib/realtor/types";
import { buildDemoDataset, PILOT_FILTERS } from "@/lib/realtor/demo-data";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const ENV_KEYS = ["NEXT_PUBLIC_REALTOR_PANEL", "NEXT_PUBLIC_REALTOR_ALLOW_DEMO"];
beforeEach(() => { mockApiFetch.mockReset(); ENV_KEYS.forEach((k) => delete process.env[k]); });

const setAccess = (status: number) => mockApiFetch.mockResolvedValue({ status });
// Espera a que la promesa de acceso se resuelva y se aplique el estado: sin esto el DOM vacío sería el estado inicial.
const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await mockApiFetch.mock.results[0].value.catch(() => undefined); await new Promise((r) => setTimeout(r, 0)); });
};

describe("interruptor fail-closed", () => {
  it("apagado por defecto: no pregunta al backend y solo avisa del motivo", () => {
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(isPanelFlagOn({})).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "true" })).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "on" })).toBe(false);
    expect(isPanelFlagOn({ NEXT_PUBLIC_REALTOR_PANEL: "1" })).toBe(true);
  });

  it("positivo: flag on + 200 muestra el panel con filtros y aviso de señales", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demand-radar-panel")).toBeInTheDocument();
    ["País", "Región", "Ciudad", "Zona", "Código postal", "Operación"].forEach((l) => expect(screen.getByLabelText(l)).toBeInTheDocument());
    expect(screen.getByText(/no certezas/)).toBeInTheDocument();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/acceso", expect.objectContaining({ method: "GET" }));
  });

  it.each([401, 403, 404, 500])("negativo: %s oculta el panel y deja solo el aviso", async (status) => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    setAccess(status);
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", status === 500 ? "error" : "sin-acceso");
  });

  it("negativo: error de red oculta el panel y deja solo el aviso", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockRejectedValue(new Error("red"));
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "error");
  });
});

describe("tenant ajeno: el cliente nunca envía tenant", () => {
  it("el backend responde 403 a un tenant sin acceso y la solicitud no lleva tenant", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    setAccess(403);
    render(<DemandRadarPanel />);
    await settle();
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso");
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

describe("DEMO solo con opt-in y siempre detrás de /acceso", () => {
  it("positivo: con opt-in y acceso 200 se rotula DEMO con banner", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByTestId("demo-banner")).toBeInTheDocument();
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges).toContain("DEMO");
    badges.forEach((b) => expect(DATA_STATUSES).toContain(b));
  });

  it("negativo: sin opt-in no hay DEMO y todo es UNAVAILABLE", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    await screen.findByTestId("demand-radar-panel");
    const badges = screen.getAllByTestId("status-badge").map((b) => b.getAttribute("data-status"));
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.every((b) => b === "UNAVAILABLE")).toBe(true);
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(isDemoAllowed({})).toBe(false);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "true" })).toBe(false);
    expect(isDemoAllowed({ NEXT_PUBLIC_REALTOR_ALLOW_DEMO: "1" })).toBe(true);
  });

  it("negativo: con opt-in pero sin 200 de /acceso (tenant sin el core) no se pinta nada, tampoco DEMO", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(403);
    render(<DemandRadarPanel />);
    await settle();
    expect(screen.queryByTestId("demand-radar-panel")).toBeNull();
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "sin-acceso");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
  });

  it("las señales que DR-TRENDS y DR-ORIGEN aún no dan salen UNAVAILABLE, sin cifras", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    await screen.findByTestId("demand-radar-panel");
    for (const t of ["Tendencia de búsqueda (Google Trends)", "Procedencia de las búsquedas"]) {
      const card = screen.getByRole("article", { name: t });
      expect(within(card).getByTestId("status-badge")).toHaveAttribute("data-status", "UNAVAILABLE");
      expect(within(card).queryByRole("list")).toBeNull();
    }
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
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    setAccess(200);
    render(<DemandRadarPanel />);
    expect(await screen.findByText(/Fair Housing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Operación")).toHaveValue("venta");
  });
});

describe("config: lectura literal de process.env (sustitución de Next en el cliente)", () => {
  it("config.ts usa referencias literales process.env.NEXT_PUBLIC_* y ningún alias", () => {
    const src = require("fs").readFileSync(require("path").join(__dirname, "../../lib/realtor/config.ts"), "utf8");
    for (const k of ["NEXT_PUBLIC_REALTOR_PANEL", "NEXT_PUBLIC_REALTOR_ALLOW_DEMO"]) {
      expect(src).toContain(`process.env.${k}`);
    }
    expect(src).not.toMatch(/=\s*process\.env\s*[;,)]/);
  });
});
