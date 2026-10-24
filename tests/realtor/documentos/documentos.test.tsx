import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";
import { DEMO_DOCS, DEMO_TEMPLATES } from "@/lib/realtor/documentos/demo";
import { countByDocStatus, templateState } from "@/lib/realtor/documentos/logic";
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
  it("plantilla aprobada solo con visto bueno completo del abogado", () => {
    const base = DEMO_TEMPLATES[0];
    expect(templateState(base)).toBe("pendiente");
    expect(templateState({ ...base, lawyerApproval: { reviewer: "", date: "2026-01-01" } })).toBe("pendiente");
    expect(templateState({ ...base, lawyerApproval: { reviewer: "SYNTH Abogado", date: "2026-01-01" } })).toBe("aprobada");
  });
  it("B5: fecha mal formada o futura no cuenta como visto bueno", () => {
    const base = DEMO_TEMPLATES[0];
    const ap = (date: string) => ({ ...base, lawyerApproval: { reviewer: "SYNTH Abogado", date } });
    expect(templateState(ap("ayer"))).toBe("pendiente");
    expect(templateState(ap("2026-13-45"))).toBe("pendiente");
    expect(templateState(ap("2999-01-01"))).toBe("pendiente");
  });

  it("ninguna plantilla DEMO está aprobada", () => {
    DEMO_TEMPLATES.forEach((p) => expect(templateState(p)).toBe("pendiente"));
  });
  it("cuenta por estado y los datos sintéticos llevan SYNTH", () => {
    expect(countByDocStatus(DEMO_DOCS)).toMatchObject({ borrador: 1, enviado: 1, firmado: 1, pending_upload: 0, active: 0, archived: 0 });
    [...DEMO_DOCS, ...DEMO_TEMPLATES].forEach((x) => expect(x.name).toMatch(/^SYNTH/));
  });
  it("el centro está vivo en el registro", () => {
    expect(REALTOR_CENTERS.find((c) => c.id === "documentos")?.href).toBe("/realtor/documentos");
  });
});

describe("pantalla", () => {
  it("positivo: DEMO con 200 muestra marca, documentos y plantillas pendientes; ES/EN", async () => {
    on(true);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<DocumentosPanel />);
    expect(await screen.findByTestId("documentos-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toHaveTextContent("DEMO · datos sintéticos");
    expect(screen.getAllByTestId("doc-row")).toHaveLength(3);
    expect(screen.getByTestId("count-firmado")).toHaveTextContent("Firmado · 1");
    screen.getAllByTestId("template-state").forEach((e) => expect(e).toHaveTextContent("Pendiente del visto bueno del abogado de Florida"));
    expect(screen.queryByText(/Aprobada por el abogado/)).toBeNull();
    await userEvent.setup().click(screen.getByTestId("lang-en"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your transaction documents");
  });

  it("negativo: sin DEMO solo «Sin datos todavía», sin cifras ni marca DEMO", async () => {
    on(false);
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<DocumentosPanel />);
    expect(await screen.findByTestId("documentos-empty")).toHaveTextContent("Sin datos todavía");
    expect(screen.queryByTestId("demo-banner")).toBeNull();
    expect(screen.queryByTestId("doc-row")).toBeNull();
    expect(screen.queryByTestId("status-counts")).toBeNull();
    expect(screen.getByTestId("documentos-panel").textContent).not.toMatch(/\d/);
  });

  it.each([401, 403, 404, 500])("acceso denegado (%s): nada de la pantalla", async (status) => {
    on(true);
    mockApiFetch.mockResolvedValue({ status });
    render(<DocumentosPanel />);
    await waitFor(() => expect(screen.getByTestId("realtor-notice")).not.toHaveAttribute("data-reason", "comprobando"));
    expect(screen.queryByTestId("documentos-panel")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  it("tenant ajeno: el cliente no envía tenant y no aparecen datos de otro tenant", async () => {
    on(false);
    const ajeno = { documents: [{ name: "Contrato OtroTenant", status: "firmado" }], templates: [{ name: "Plantilla OtroTenant" }] };
    mockApiFetch.mockResolvedValue({ status: 200, ok: true, json: async () => ajeno });
    render(<DocumentosPanel />);
    await screen.findByTestId("documentos-empty");
    expect(screen.queryByText(/OtroTenant/)).toBeNull();
    // El generador también lee /operations en la lista vacía: exactamente 1 llamada a /documents y NINGUNA con tenant.
    await waitFor(() => expect(mockApiFetch.mock.calls.length).toBeGreaterThanOrEqual(1));
    expect(mockApiFetch.mock.calls.filter(([u]) => String(u).includes("/documents"))).toHaveLength(1);
    for (const [url, init] of mockApiFetch.mock.calls) {
      expect(String(url)).not.toMatch(/tenant/i);
      expect(JSON.stringify(init ?? {})).not.toMatch(/tenant/i);
    }
    expect(within(screen.getByTestId("documentos-panel")).queryByText(/SYNTH/)).toBeNull();
  });

  it("apagado: no pregunta al backend", () => {
    render(<DocumentosPanel />);
    expect(screen.getByTestId("realtor-notice")).toHaveAttribute("data-reason", "apagado");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
