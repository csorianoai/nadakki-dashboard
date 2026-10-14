import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";
import { DEMO_CONTACTS } from "@/lib/realtor/clientes/demo";
import { applyFilters, countByStatus, isClient, maskEmail, maskPhone } from "@/lib/realtor/clientes/logic";
import { NO_FILTERS } from "@/lib/realtor/clientes/types";
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
  it("cliente = rol vigente; el resto va en Leads", () => {
    expect(DEMO_CONTACTS.filter(isClient).map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(DEMO_CONTACTS.filter((c) => !isClient(c)).map((c) => c.id)).toEqual(["c4", "c5", "c6"]);
  });
  it("filtra por rol, origen y estado y cuenta por estado", () => {
    expect(applyFilters(DEMO_CONTACTS, { ...NO_FILTERS, role: "inquilino" }).map((c) => c.id)).toEqual(["c1"]);
    expect(applyFilters(DEMO_CONTACTS, { ...NO_FILTERS, origin: "web", leadStatus: "perdido" }).map((c) => c.id)).toEqual(["c6"]);
    expect(countByStatus(DEMO_CONTACTS)).toEqual({ nuevo: 1, contactado: 2, calificado: 1, perdido: 1 });
  });
  it("enmascara teléfono y correo", () => {
    expect(maskPhone("305-555-0101")).toBe("•••-•••-0101");
    expect(maskEmail("synth1@example.invalid")).toBe("s•••@example.invalid");
  });
  it("los datos sintéticos respetan SYNTH / 555-01xx / @example.invalid", () => {
    DEMO_CONTACTS.forEach((c) => {
      expect(c.name).toMatch(/^SYNTH/);
      expect(c.phone).toMatch(/555-01\d\d$/);
      expect(c.email).toMatch(/@example\.invalid$/);
    });
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "clientes")?.href).toBe("/realtor/clientes");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, lista, conteos y ficha enmascarada; solo llama a /acceso sin tenant", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<ClientesPanel />);
    expect(await screen.findByTestId("clientes-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getAllByTestId("contact-row")).toHaveLength(3);
    expect(screen.getByTestId("count-calificado")).toHaveTextContent("Calificado · 1");
    expect(screen.getByTestId("ficha-phone")).toHaveTextContent("•••-•••-0101");
    expect(screen.getByTestId("contact-ficha")).not.toHaveTextContent("555-0101");
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Rol"), "comprador");
    expect(screen.getAllByTestId("contact-row")).toHaveLength(1);
    await user.click(screen.getByTestId("tab-leads"));
    await user.selectOptions(screen.getByLabelText("Rol"), "todos");
    expect(screen.getAllByTestId("contact-row")).toHaveLength(3);
    await user.click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Clients: buyers and renters");
    // Fair Housing: ningún filtro de idioma ni de clase protegida.
    expect(screen.queryByLabelText(/idioma|language/i, { selector: "select" })).toBeNull();
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<ClientesPanel />);
    expect(await screen.findByTestId("clientes-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("contact-row")).toBeNull();
    expect(screen.queryByTestId("status-counts")).toBeNull();
    expect(screen.getByTestId("clientes-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<ClientesPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("clientes-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant (ni cabecera ni parámetro) y los datos de otro tenant no aparecen", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200 });
    render(<ClientesPanel />);
    await screen.findByTestId("clientes-empty");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockApiFetch.mock.calls[0];
    expect(String(url)).not.toMatch(/tenant/i);
    expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    expect(within(screen.getByTestId("clientes-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("apagado: no pregunta al backend", () => {
    render(<ClientesPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
