import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { OperacionesPanel } from "@/components/realtor/operaciones/OperacionesPanel";
import { DEMO_OPERATIONS } from "@/lib/realtor/operaciones/demo";
import { applyFilters, countByStage, inStage, opportunities } from "@/lib/realtor/operaciones/logic";
import { NO_FILTERS } from "@/lib/realtor/operaciones/types";
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

describe("lógica", () => {
  it("la venta no tiene expediente: sin etapa y fuera de los conteos", () => {
    expect(opportunities(DEMO_OPERATIONS).map((o) => o.id)).toEqual(["o6", "o7"]);
    expect(DEMO_OPERATIONS.filter((o) => o.kind === "venta").every((o) => o.stage === null)).toBe(true);
    expect(countByStage(DEMO_OPERATIONS)).toEqual({ propiedad: 1, condiciones: 1, documentos: 0, requisitos: 1, aprobacion: 1, firma: 0, cierre: 1 });
  });
  it("filtra por tipo y lista por etapa", () => {
    expect(applyFilters(DEMO_OPERATIONS, { kind: "venta" }).map((o) => o.id)).toEqual(["o6", "o7"]);
    expect(applyFilters(DEMO_OPERATIONS, NO_FILTERS)).toHaveLength(7);
    expect(inStage(DEMO_OPERATIONS, "aprobacion").map((o) => o.id)).toEqual(["o4"]);
  });
  it("los datos sintéticos llevan el prefijo SYNTH", () => {
    DEMO_OPERATIONS.forEach((o) => expect(o.code).toMatch(/^SYNTH/));
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "operaciones")?.href).toBe("/realtor/operaciones");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, etapas con conteos y oportunidades; solo llama a /acceso sin tenant", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<OperacionesPanel />);
    expect(await screen.findByTestId("operaciones-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(within(screen.getByTestId("stage-list")).getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByTestId("count-requisitos")).toHaveTextContent("1 expedientes");
    expect(within(screen.getByTestId("stage-panel")).getAllByTestId("op-row")).toHaveLength(1);
    expect(within(screen.getByTestId("opp-panel")).getAllByTestId("op-row")).toHaveLength(2);
    const user = userEvent.setup();
    await user.click(screen.getByTestId("stage-firma"));
    expect(screen.getByTestId("stage-empty")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Tipo de operación"), "venta");
    expect(screen.getByTestId("count-propiedad")).toHaveTextContent("0 expedientes");
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Operations");
    // Fair Housing: ningún filtro de idioma ni de clase protegida.
    expect(screen.queryByLabelText(/idioma|language/i, { selector: "select" })).toBeNull();
  });

  it("Finanzas: con DEMO muestra comisión, reparto y cierres; sin DEMO no pinta ninguna cifra", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    const { unmount } = render(<OperacionesPanel />);
    await screen.findByTestId("operaciones-panel");
    const fin = screen.getByTestId("fin-section");
    for (const id of ["fin-gross", "fin-fee", "fin-split", "fin-closed"]) expect(within(fin).getByTestId(id)).toBeInTheDocument();
    expect(screen.getByTestId("fin-split")).toHaveTextContent("70 / 30");
    unmount();
    delete process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO;
    on(false);
    render(<OperacionesPanel />);
    await screen.findByTestId("operaciones-empty");
    expect(screen.queryByTestId("fin-section")).toBeNull();
    expect(screen.queryByTestId("fin-gross")).toBeNull();
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<OperacionesPanel />);
    expect(await screen.findByTestId("operaciones-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("op-row")).toBeNull();
    expect(screen.queryByTestId("stage-list")).toBeNull();
    expect(screen.getByTestId("operaciones-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<OperacionesPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("operaciones-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant (ni cabecera ni parámetro) y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<OperacionesPanel />);
    await screen.findByTestId("operaciones-empty");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("operaciones-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno con DEMO: solo se pintan datos SYNTH propios del demo y la petición sigue sin tenant", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<OperacionesPanel />);
    await screen.findByTestId("operaciones-panel");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("operaciones-panel")).getAllByText(/SYNTH/).length).toBeGreaterThan(0);
  });

  it("apagado: no pregunta al backend", () => {
    render(<OperacionesPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
