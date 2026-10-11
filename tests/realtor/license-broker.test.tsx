import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LicenseBrokerDraft } from "../../components/realtor/LicenseBrokerDraft";
import { altaEn } from "../../components/realtor/alta-copy";
jest.mock("../../components/realtor/LicenseBrokerDraft.module.css", () => ({ __esModule: true, default: {} }));
const id = "00000000-0000-4000-8000-000000000001";
const props = {
  licenseAvailability: "ready" as const, brokerAvailability: "ready" as const,
  jurisdictions: [{ code: "US-FL", label: "Jurisdicción sintética", licenseTypes: [{ id: "synth-agent", label: "Tipo sintético" }] }],
  brokerages: [{ id, label: "Firma sintética" }], supervisors: [{ id, label: "Supervisor sintético" }],
  supervisionRequired: true,
};
function fillLicense() {
  fireEvent.change(screen.getByLabelText("Jurisdicción"), { target: { value: "US-FL" } });
  fireEvent.change(screen.getByLabelText("Tipo de licencia"), { target: { value: "synth-agent" } });
  fireEvent.change(screen.getByLabelText("Número de licencia"), { target: { value: "SYNTH-001" } });
}
describe("Licencia y Broker: componentes aislados", () => {
  it("starts with no confirmed status or invented data", () => {
    render(<LicenseBrokerDraft {...props} />);
    expect(screen.getByText(/Estado de licencia: Sin estado confirmado/)).toBeInTheDocument();
    expect(screen.getByLabelText("Número de licencia")).toHaveValue("");
    expect(screen.queryByText(/DEMO/)).not.toBeInTheDocument();
  });
  it.each(["loading", "empty", "error", "UNAVAILABLE"] as const)("renders %s without editable license actions", availability => {
    render(<LicenseBrokerDraft {...props} licenseAvailability={availability} />);
    expect(screen.getByRole(availability === "error" ? "alert" : "status")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuar a Broker" })).not.toBeInTheDocument();
  });
  it.each(["loading", "empty", "error", "UNAVAILABLE"] as const)("renders broker %s without selection actions", availability => {
    render(<LicenseBrokerDraft {...props} initialStep="broker" brokerAvailability={availability} />);
    expect(screen.getByRole(availability === "error" ? "alert" : "status")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revisar datos" })).not.toBeInTheDocument();
  });
  it("defaults to unavailable and handles missing catalog/pack", () => {
    const { rerender } = render(<LicenseBrokerDraft />);
    expect(screen.getByRole("status")).toHaveTextContent("UNAVAILABLE");
    rerender(<LicenseBrokerDraft {...props} jurisdictions={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No hay opciones");
    rerender(<LicenseBrokerDraft {...props} initialStep="broker" />);
    // InitialStep never overrides existing navigation state.
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Licencia");
  });
  it("focuses an invalid field and blocks forward navigation", async () => {
    render(<LicenseBrokerDraft {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Continuar a Broker" }));
    expect(screen.getByLabelText("Jurisdicción")).toHaveFocus();
    expect(screen.getByLabelText("Jurisdicción")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Licencia");
  });
  it("validates 1–64 characters without implying verification", () => {
    render(<LicenseBrokerDraft {...props} />);
    fillLicense();
    fireEvent.change(screen.getByLabelText("Número de licencia"), { target: { value: "a".repeat(65) } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.getByRole("alert")).toHaveTextContent("1 y 64");
    fireEvent.change(screen.getByLabelText("Número de licencia"), { target: { value: "a".repeat(64) } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.getByRole("status")).toHaveTextContent("sin guardar");
    expect(screen.queryByText(/Estado de licencia: Verificada/)).not.toBeInTheDocument();
  });
  it("clears license type when jurisdiction changes", () => {
    render(<LicenseBrokerDraft {...props} />);
    fillLicense();
    fireEvent.change(screen.getByLabelText("Jurisdicción"), { target: { value: "" } });
    expect(screen.getByLabelText("Tipo de licencia")).toHaveValue("");
  });
  it("supports keyboard navigation, step focus and preserved in-memory draft", async () => {
    render(<LicenseBrokerDraft {...props} />);
    fillLicense();
    screen.getByRole("button", { name: "Continuar a Broker" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
    expect(screen.getByRole("list")).toHaveTextContent("2 · Broker");
    fireEvent.click(screen.getByRole("button", { name: "Volver a Licencia" }));
    expect(screen.getByLabelText("Número de licencia")).toHaveValue("SYNTH-001");
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  });
  it("requires a supervisor only when the pack requires it, with no approval", () => {
    render(<LicenseBrokerDraft {...props} initialStep="broker" agentStatus="pending_approval" />);
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.getByLabelText("Broker supervisor")).toHaveFocus();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Broker supervisor"), { target: { value: id } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.getByRole("status")).toHaveTextContent("sin guardar");
    expect(screen.getByText(/Estado del agente: Pendiente de aprobación/)).toBeInTheDocument();
  });
  it("does not require optional brokerage or supervisor", () => {
    render(<LicenseBrokerDraft {...props} initialStep="broker" supervisionRequired={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("sin guardar");
  });
  it("fails closed visually without a supervision pack or supervisor choices", () => {
    const { rerender } = render(<LicenseBrokerDraft {...props} initialStep="broker" supervisionRequired={undefined} />);
    expect(screen.getByRole("status")).toHaveTextContent("Falta confirmar");
    rerender(<LicenseBrokerDraft {...props} initialStep="broker" supervisors={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("No hay opciones");
  });
  it("rejects malformed identifiers even if supplied as a choice", () => {
    render(<LicenseBrokerDraft {...props} initialStep="broker" supervisors={[{ id: "bad", label: "Inválido" }]} />);
    fireEvent.change(screen.getByLabelText("Broker supervisor"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it("uses injected English copy and accessible field/error associations", () => {
    render(<LicenseBrokerDraft {...props} copy={altaEn} lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Review details" }));
    const field = screen.getByLabelText("License number");
    expect(field).toHaveAccessibleDescription("Enter between 1 and 64 characters.");
    expect(screen.getByRole("region")).toHaveAttribute("lang", "en");
  });
  it("never calls transport or storage during local review and navigation", () => {
    const fetchBefore = global.fetch;
    const fetchSpy = jest.fn(); global.fetch = fetchSpy;
    const storage = jest.spyOn(Storage.prototype, "setItem");
    try {
      render(<LicenseBrokerDraft {...props} />);
      fillLicense(); fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
      fireEvent.click(screen.getByRole("button", { name: "Continuar a Broker" }));
      fireEvent.change(screen.getByLabelText("Broker supervisor"), { target: { value: id } });
      fireEvent.click(screen.getByRole("button", { name: "Revisar datos" }));
      expect(fetchSpy).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: /guardar|enviar|aprobar|conectar/i })).not.toBeInTheDocument();
    } finally { global.fetch = fetchBefore; storage.mockRestore(); }
  });
});
