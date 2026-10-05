/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import ContableLibroDiarioPage from "../page";

// El aviso fiscal del shell lee la sesion; aqui se mide solo esta pantalla.
jest.mock("@/components/contable/FacturacionElectronicaAviso", () => ({ FacturacionElectronicaAviso: () => null }));

describe("/contable/libro-diario", () => {
  it("explica que no hay pantalla y no finge ser el libro mayor", () => {
    render(<ContableLibroDiarioPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Libro diario");
    expect(screen.getByTestId("libro-diario-sin-pantalla")).toHaveTextContent("todavía no tiene pantalla");
  });

  it("ofrece lo que si existe", () => {
    render(<ContableLibroDiarioPage />);
    expect(screen.getByRole("link", { name: "Ir al libro mayor" })).toHaveAttribute("href", "/contable/libro-mayor");
    expect(screen.getByRole("link", { name: "Registrar un asiento" })).toHaveAttribute("href", "/contable/asientos/nuevo");
  });
});
