import fs from "fs";
import path from "path";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { CareerDirectorPanel } from "@/components/realtor/career-director/CareerDirectorPanel";
import { center } from "@/lib/realtor/career-director/center";
import { DEMO_GOALS, DEMO_LICENSE, DEMO_SUPERVISION, METRICS } from "@/lib/realtor/career-director/demo";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  delete process.env.NEXT_PUBLIC_REALTOR_PANEL;
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
});
const open = (demo: boolean, status = 200) => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  if (demo) process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status, json: async () => ({ demo: true }) });
  return render(<CareerDirectorPanel />);
};

describe("Career Director", () => {
  it("positivo: DEMO muestra licencia, supervisión, metas y el rótulo DEMO; lo sin fuente es NO_DISPONIBLE", async () => {
    open(true);
    expect(await screen.findByTestId("career-director-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Career Director");
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getByTestId("license-state")).toHaveTextContent("Por vencer");
    expect(screen.getByTestId("license-days")).toHaveTextContent("Faltan 48 días");
    expect(screen.getAllByTestId("goal")).toHaveLength(DEMO_GOALS.length);
    METRICS.filter((m) => !m.source).forEach((m) => {
      const el = screen.getByTestId(`no-disponible-${m.id}`);
      expect(el).toHaveAttribute("data-quality", "NO_DISPONIBLE");
      expect(el).toHaveTextContent("Sin datos todavía");
    });
    METRICS.filter((m) => m.source).forEach((m) => expect(screen.queryByTestId(`no-disponible-${m.id}`)).toBeNull());
  });

  it("positivo: alterna a inglés", async () => {
    open(true);
    await screen.findByTestId("career-director-panel");
    await userEvent.click(screen.getByTestId("lang-toggle"));
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · synthetic data");
    expect(screen.getByTestId("license-days")).toHaveTextContent("48 days left");
  });

  it("negativo: sin DEMO dice «Sin datos todavía», sin cifras, sin rótulo DEMO ni gráficos", async () => {
    open(false);
    expect(await screen.findByTestId("career-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryAllByTestId("goal")).toHaveLength(0);
    expect(screen.getByTestId("career-director-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("negativo: acceso %s no pinta nada del centro", async (status) => {
    open(true, status);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).toBeInTheDocument());
    expect(screen.queryByTestId("career-director-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("interruptor apagado: no pregunta al backend ni pinta nada", () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<CareerDirectorPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("tenant ajeno: el cliente solo pregunta por el acceso, sin tenant en ruta, cabeceras ni cuerpo", async () => {
    open(true);
    await screen.findByTestId("career-director-panel");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(url).toBe("/api/v1/realestate/acceso");
    expect(JSON.stringify(init)).not.toMatch(/tenant/i);
    expect(JSON.stringify({ DEMO_LICENSE, DEMO_SUPERVISION, DEMO_GOALS })).not.toMatch(/tenant/i);
  });

  it("DEMO sintético: prefijo SYNTH, teléfonos 555-01xx y correos @example.invalid", () => {
    expect(DEMO_LICENSE.number).toMatch(/^SYNTH/);
    expect(DEMO_SUPERVISION.supervisor).toMatch(/^SYNTH/);
    expect(DEMO_SUPERVISION.phone).toMatch(/^555-01\d\d$/);
    expect(DEMO_SUPERVISION.email).toMatch(/@example\.invalid$/);
  });

  it("registro: el centro se declara vivo y el código no usa clases protegidas ni tenant del cliente", () => {
    expect(center.href).toBe("/realtor/career-director");
    const dirs = ["components/realtor/career-director", "lib/realtor/career-director"];
    const src = dirs.flatMap((d) => fs.readdirSync(path.join(process.cwd(), d)).map((f) => fs.readFileSync(path.join(process.cwd(), d, f), "utf8"))).join("\n");
    expect(src).not.toMatch(/x-tenant|tenant_id|tenantId|race|religion|nationality|ethnic/i);
  });
});
