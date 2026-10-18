import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AgentSitePanel } from "@/components/realtor/AgentSitePanel";
import { CLOSED_GATES, DEMO_PROFILE, publishBlockers, validateContact } from "@/lib/realtor/agent-site";

const mockApiFetch = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const ENV_KEYS = ["NEXT_PUBLIC_REALTOR_PANEL", "NEXT_PUBLIC_REALTOR_ALLOW_DEMO", "NEXT_PUBLIC_APP_ENV"];
beforeEach(() => { mockApiFetch.mockReset(); ENV_KEYS.forEach((k) => delete process.env[k]); });

const turnOn = () => {
  process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
  process.env.NEXT_PUBLIC_REALTOR_ALLOW_DEMO = "1";
  process.env.NEXT_PUBLIC_APP_ENV = "local";
};
const settle = async () => {
  await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());
  await act(async () => { await mockApiFetch.mock.results[0].value.catch(() => undefined); await new Promise((r) => setTimeout(r, 0)); });
};

describe("web del agente", () => {
  it("positivo: 200 muestra DEMO, brokerage licenciada junto al contacto, aviso y consentimiento", async () => {
    turnOn();
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<AgentSitePanel />);
    expect(await screen.findByTestId("agent-site-panel")).toBeInTheDocument();
    expect(screen.getByTestId("demo-banner")).toBeInTheDocument();
    expect(screen.getAllByTestId("status-badge")[0]).toHaveAttribute("data-status", "DEMO");
    const contact = screen.getByTestId("contact-data");
    expect(contact).toHaveTextContent(DEMO_PROFILE.brokerageLicensedName);
    expect(contact).toHaveTextContent(DEMO_PROFILE.email);
    expect(screen.getByTestId("privacy-notice")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/v1/realestate/acceso", expect.objectContaining({ method: "GET" }));
  });

  it("negativo: sin consentimiento no se envía y se muestra el error", async () => {
    turnOn();
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<AgentSitePanel />);
    await screen.findByTestId("agent-site-panel");
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Hola" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
    expect(screen.getByText(/aceptar el aviso de privacidad/)).toBeInTheDocument();
    expect(screen.queryByTestId("submit-unavailable")).toBeNull();
    expect(validateContact({ name: "a", email: "x", message: "m", consent: true }).email).toBeDefined();
  });

  it("con consentimiento el envío se rotula UNAVAILABLE, nunca como enviado", async () => {
    turnOn();
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<AgentSitePanel />);
    await screen.findByTestId("agent-site-panel");
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Mensaje"), { target: { value: "Hola" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
    expect(screen.getByTestId("submit-unavailable")).toHaveTextContent("no se envió");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403, 404])("tenant ajeno / sin core: %s no muestra nada", async (status) => {
    turnOn();
    mockApiFetch.mockResolvedValue({ status });
    const { container } = render(<AgentSitePanel />);
    await settle();
    expect(container).toBeEmptyDOMElement();
  });

  it("apagado por defecto: no consulta al backend y nunca envía tenant_id", async () => {
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    const { container } = render(<AgentSitePanel />);
    expect(container).toBeEmptyDOMElement();
    expect(mockApiFetch).not.toHaveBeenCalled();
    turnOn();
    render(<AgentSitePanel />);
    await screen.findByTestId("agent-site-panel");
    expect(JSON.stringify(mockApiFetch.mock.calls)).not.toMatch(/tenant/i);
  });

  it("sin DEMO la web se rotula UNAVAILABLE y no se inventa contenido", async () => {
    process.env.NEXT_PUBLIC_REALTOR_PANEL = "1";
    mockApiFetch.mockResolvedValue({ status: 200, json: async () => ({ demo: true }) });
    render(<AgentSitePanel />);
    expect(await screen.findByTestId("site-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("contact-data")).toBeNull();
  });

  it("publicación: bloqueada con puertas cerradas, y exige brokerage licenciada aun con puertas abiertas", () => {
    expect(publishBlockers(DEMO_PROFILE, CLOSED_GATES)).toHaveLength(4);
    const open = { domainVerified: true, licenseApproved: true, brokerApproved: true, policyApproved: true };
    expect(publishBlockers(DEMO_PROFILE, open)).toEqual([]);
    expect(publishBlockers({ ...DEMO_PROFILE, brokerageLicensedName: " " }, open)).toEqual(["Broker sin aprobar"]);
  });
});
