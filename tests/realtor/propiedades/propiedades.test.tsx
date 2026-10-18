import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";
import { DEMO_PROPERTIES } from "@/lib/realtor/propiedades/demo";
import { applyFilters, countByStage, countByStatus, formatPrice } from "@/lib/realtor/propiedades/logic";
import { NO_FILTERS } from "@/lib/realtor/propiedades/types";
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
  it("filtra por tipo, estado y etapa", () => {
    expect(applyFilters(DEMO_PROPERTIES, { ...NO_FILTERS, type: "condominio" }).map((p) => p.id)).toEqual(["p1", "p5"]);
    expect(applyFilters(DEMO_PROPERTIES, { ...NO_FILTERS, status: "activa", stage: "cma" }).map((p) => p.id)).toEqual(["p3"]);
    expect(applyFilters([], NO_FILTERS)).toEqual([]);
  });
  it("cuenta por estado y por etapa", () => {
    expect(countByStatus(DEMO_PROPERTIES)).toEqual({ activa: 2, en_contrato: 1, vendida: 1, retirada: 1 });
    expect(countByStage(DEMO_PROPERTIES).closing).toBe(1);
    expect(countByStage(DEMO_PROPERTIES).offers).toBe(0);
  });
  it("el precio lleva su moneda", () => {
    expect(formatPrice(485000, "USD", "en")).toBe("USD 485,000");
    expect(formatPrice(7800000, "DOP", "en")).toMatch(/^DOP 7,800,000$/);
  });
  it("los datos sintéticos llevan prefijo SYNTH", () => {
    DEMO_PROPERTIES.forEach((p) => {
      expect(p.address).toMatch(/^SYNTH/);
      p.units.forEach((u) => expect(u.label).toMatch(/^SYNTH/));
    });
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "propiedades")?.href).toBe("/realtor/propiedades");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, lista, conteos y ficha con unidades y moneda", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<PropiedadesPanel />);
    expect(await screen.findByTestId("propiedades-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getAllByTestId("property-row")).toHaveLength(5);
    expect(screen.getByTestId("count-activa")).toHaveTextContent("Activa · 2");
    expect(screen.getByTestId("stage-closing")).toHaveTextContent("Cierre · 1");
    expect(screen.getByTestId("ficha-price")).toHaveTextContent("USD 485,000");
    expect(screen.getAllByRole("listitem").some((li) => /SYNTH 1B/.test(li.textContent ?? ""))).toBe(true);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Tipo"), "casa");
    expect(screen.getAllByTestId("property-row")).toHaveLength(1);
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Properties and listings");
    // Fair Housing: ningún filtro de idioma ni del barrio.
    expect(screen.queryByLabelText(/idioma|language|barrio|neighborhood/i, { selector: "select" })).toBeNull();
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<PropiedadesPanel />);
    expect(await screen.findByTestId("propiedades-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("property-row")).toBeNull();
    expect(screen.queryByTestId("status-counts")).toBeNull();
    expect(screen.getByTestId("propiedades-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<PropiedadesPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("propiedades-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<PropiedadesPanel />);
    await screen.findByTestId("propiedades-empty");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("propiedades-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno con DEMO activo: un 404 del acceso no deja ningún dato SYNTH", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 404 });
    render(<PropiedadesPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("propiedades-panel")).toBeNull();
    expect(screen.queryByTestId("property-row")).toBeNull();
    expect(document.body.textContent).not.toMatch(/SYNTH/);
  });

  it("apagado: no pregunta al backend", () => {
    render(<PropiedadesPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
