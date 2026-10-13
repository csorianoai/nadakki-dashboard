import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { PropietariosPanel } from "@/components/realtor/propietarios/PropietariosPanel";
import { DEMO_OWNERS } from "@/lib/realtor/propietarios/demo";
import { applyFilters, countByRole, formatPrice } from "@/lib/realtor/propietarios/logic";
import { NO_FILTERS } from "@/lib/realtor/propietarios/types";
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
  it("filtra por rol y por acuerdo y cuenta por rol", () => {
    expect(applyFilters(DEMO_OWNERS, { ...NO_FILTERS, role: "vendedor" }).map((o) => o.id)).toEqual(["o3"]);
    expect(applyFilters(DEMO_OWNERS, { ...NO_FILTERS, agreement: "vigente" }).map((o) => o.id)).toEqual(["o1", "o2"]);
    expect(applyFilters(DEMO_OWNERS, { role: "vendedor", agreement: "vigente" })).toEqual([]);
    expect(countByRole(DEMO_OWNERS)).toEqual({ arrendador: 2, vendedor: 1 });
  });
  it("formatea el precio: alquiler por mes, venta total", () => {
    expect(formatPrice({ role: "arrendador", priceUsd: 3200 }, "es")).toBe("USD 3,200/mes");
    expect(formatPrice({ role: "vendedor", priceUsd: 485000 }, "en")).toBe("USD 485,000");
  });
  it("los datos sintéticos llevan prefijo SYNTH", () => {
    DEMO_OWNERS.forEach((o) => { expect(o.name).toMatch(/^SYNTH/); expect(o.property).toMatch(/^SYNTH/); });
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "propietarios")?.href).toBe("/realtor/propietarios");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, tabla y conteos; filtra y cambia de idioma", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<PropietariosPanel />);
    expect(await screen.findByTestId("propietarios-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getAllByTestId("owner-row")).toHaveLength(3);
    expect(screen.getByTestId("count-arrendador")).toHaveTextContent("Arrendador · 2");
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Rol"), "vendedor");
    expect(screen.getAllByTestId("owner-row")).toHaveLength(1);
    await user.selectOptions(screen.getByLabelText("Acuerdo"), "vigente");
    expect(screen.getByTestId("propietarios-nomatch")).toBeInTheDocument();
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Owners");
    // Fair Housing: ningún filtro de idioma ni de clase protegida.
    expect(screen.queryByLabelText(/idioma|language/i, { selector: "select" })).toBeNull();
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<PropietariosPanel />);
    expect(await screen.findByTestId("propietarios-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("owner-row")).toBeNull();
    expect(screen.queryByTestId("role-counts")).toBeNull();
    expect(screen.getByTestId("propietarios-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<PropietariosPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("propietarios-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<PropietariosPanel />);
    await screen.findByTestId("propietarios-empty");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("propietarios-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("apagado: no pregunta al backend", () => {
    render(<PropietariosPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
