import { act, render, screen, waitFor } from "@testing-library/react";
import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import { center } from "@/lib/realtor/mi-dia/center";
import { DEMO_LEADS } from "@/lib/realtor/mi-dia/demo";
import { blockerText, miDiaEn, miDiaEs } from "@/lib/realtor/mi-dia/copy";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

beforeEach(() => {
  mockApiFetch.mockReset();
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
  jest.spyOn(window.navigator, "language", "get").mockReturnValue("es-ES");
});
afterEach(() => jest.restoreAllMocks());

const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
};

it("el centro se declara vivo", () => { expect(center.href).toBe("/realtor/mi-dia"); });

it("positivo: DEMO muestra marcas y datos SYNTH con teléfonos 555-01xx y correos .invalid", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<MiDiaPanel />);
  expect(await screen.findByTestId("mi-dia-demo")).toHaveTextContent("DEMO · datos sintéticos");
  expect(screen.getByTestId("mi-dia-leads-count")).toHaveTextContent(String(DEMO_LEADS.length));
  expect(screen.getAllByTestId("mi-dia-row").length).toBeGreaterThan(0);
  expect(screen.queryByTestId("mi-dia-desk")).toBeNull();
  expect(screen.getByTestId("mi-dia-kpi-pending")).toHaveTextContent(String(DEMO_LEADS.length));
  expect(screen.getByTestId("mi-dia-next")).toBeInTheDocument();
  DEMO_LEADS.forEach((l) => {
    expect(l.name).toMatch(/^SYNTH/);
    expect(l.phone).toMatch(/^555-01\d\d$/);
    expect(l.email).toMatch(/@example\.invalid$/);
  });
});

it("negativo: sin DEMO dice «Sin datos todavía», NO_DISPONIBLE y ninguna cifra", async () => {
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<MiDiaPanel />);
  expect(await screen.findByTestId("mi-dia-empty")).toHaveTextContent("Sin datos todavía");
  expect(screen.getAllByTestId("mi-dia-no-disponible").length).toBe(2);
  expect(screen.queryByTestId("mi-dia-demo")).toBeNull();
  expect(screen.queryByTestId("mi-dia-row")).toBeNull();
  expect(screen.queryByTestId("mi-dia-leads-count")).toBeNull();
  expect(screen.queryByTestId("mi-dia-kpis")).toBeNull();
  expect(screen.queryByTestId("mi-dia-next")).toBeNull();
  expect(screen.getByTestId("mi-dia-panel").textContent).not.toMatch(/\d/);
});

it.each([401, 403, 404])("acceso denegado (%s): nada de la pantalla, solo el aviso", async (status) => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status });
  render(<MiDiaPanel />);
  await settle();
  expect(screen.queryByTestId("mi-dia-panel")).toBeNull();
  expect(screen.queryByTestId("mi-dia-row")).toBeNull();
  expect(screen.getByTestId("realtor-notice")).toBeInTheDocument();
});

it("tenant ajeno: el tenant no viaja desde el cliente y un 403 no deja datos", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 403 });
  render(<MiDiaPanel />);
  await settle();
  const [path, init] = mockApiFetch.mock.calls[0];
  expect(path).toBe("/api/v1/realestate/acceso");
  expect(JSON.stringify(init ?? {}).toLowerCase()).not.toMatch(/tenant/);
  expect(screen.queryByTestId("mi-dia-panel")).toBeNull();
});

it("tenant ajeno: un 404 deja la pantalla vacía y sin filas", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 404 });
  render(<MiDiaPanel />);
  await settle();
  expect(screen.queryByTestId("mi-dia-panel")).toBeNull();
  expect(screen.queryByTestId("mi-dia-leads")).toBeNull();
  expect(screen.getByTestId("realtor-notice")).toBeInTheDocument();
});

it("un código de bloqueo desconocido no se pinta como texto técnico", () => {
  expect(blockerText(miDiaEs, "missing_x")).toBe(miDiaEs.blockerUnknown);
  expect(blockerText(miDiaEn, "missing_x")).toBe(miDiaEn.blockerUnknown);
  expect(blockerText(miDiaEs, "missing_disclosure")).toBe(miDiaEs.blockers.missing_disclosure);
});

it("la vista Broker añade los pendientes del broker desk", async () => {
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  mockApiFetch.mockResolvedValue({ status: 200 });
  const shell = document.createElement("div");
  shell.setAttribute("data-testid", "realtor-shell");
  shell.setAttribute("data-view", "agente");
  document.body.appendChild(shell);
  render(<MiDiaPanel />);
  await screen.findByTestId("mi-dia-panel");
  expect(screen.queryByTestId("mi-dia-desk")).toBeNull();
  await act(async () => { shell.setAttribute("data-view", "broker"); await new Promise((r) => setTimeout(r, 0)); });
  expect(screen.getByTestId("mi-dia-desk")).toBeInTheDocument();
  shell.remove();
});

it("ES y EN tienen las mismas claves", () => {
  expect(Object.keys(miDiaEn).sort()).toEqual(Object.keys(miDiaEs).sort());
});

it("EN: con navegador en inglés el texto sale en inglés", async () => {
  jest.spyOn(window.navigator, "language", "get").mockReturnValue("en-US");
  mockApiFetch.mockResolvedValue({ status: 200 });
  render(<MiDiaPanel />);
  expect(await screen.findByTestId("mi-dia-empty")).toHaveTextContent("No data yet");
});
