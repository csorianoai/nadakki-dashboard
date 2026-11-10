import { render, screen } from "@testing-library/react";
import { CifraKpiCard } from "@/components/analytics/kit";
import * as F from "./fixtures/cifras.fixture";

const norm = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

describe("CifraKpiCard", () => {
  it("muestra valor, variacion positiva, fuente y fecha", () => {
    render(<CifraKpiCard cifra={F.CIFRA_SUBE} />);
    expect(screen.getByText("Leads nuevos")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(norm(screen.getByTestId("cifra-variacion").textContent)).toContain("+20,0 %");
    expect(screen.getByTestId("cifra-variacion").textContent).toContain("vs periodo anterior");
    expect(screen.getByText(/Fuente: PROTOTIPO · fixture de pruebas/)).toBeInTheDocument();
    expect(screen.getByText(/Dato al 10 nov 2026/)).toBeInTheDocument();
  });
  it("variacion negativa con signo menos tipografico", () => {
    render(<CifraKpiCard cifra={F.CIFRA_BAJA} />);
    expect(norm(screen.getByTestId("cifra-variacion").textContent)).toContain("−25,0 %");
  });
  it("variacion cero", () => {
    render(<CifraKpiCard cifra={F.CIFRA_IGUAL} />);
    expect(norm(screen.getByTestId("cifra-variacion").textContent)).toContain("0,0 %");
  });
  it("periodo anterior 0 => 'Datos insuficientes' en la variacion, sin Infinity ni NaN", () => {
    const { container } = render(<CifraKpiCard cifra={F.CIFRA_ANTERIOR_CERO} />);
    expect(screen.getByTestId("cifra-variacion-insuficiente")).toHaveTextContent(/datos insuficientes/i);
    expect(container.textContent).not.toMatch(/Infinity|NaN/);
  });
  it("periodo anterior nulo => datos insuficientes", () => {
    render(<CifraKpiCard cifra={F.CIFRA_ANTERIOR_NULO} />);
    expect(screen.getByTestId("cifra-variacion-insuficiente")).toBeInTheDocument();
  });
  it("sin fuente => estado pendiente de integracion, no pinta el valor", () => {
    const { container } = render(<CifraKpiCard cifra={F.CIFRA_SIN_FUENTE} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-estado", "pendiente_integracion");
    expect(screen.getByText(/pendiente de integraci/i)).toBeInTheDocument();
    expect(container.textContent).not.toContain("5");
  });
  it("sin fecha => pendiente de integracion", () => {
    render(<CifraKpiCard cifra={F.CIFRA_SIN_FECHA} />);
    expect(screen.getByRole("status")).toHaveAttribute("data-estado", "pendiente_integracion");
  });
  it("mejor_si baja: el costo que sube no se pinta como mejora", () => {
    render(<CifraKpiCard cifra={F.CIFRA_COSTO_SUBE} />);
    expect(screen.getByTestId("cifra-variacion").getAttribute("data-sentido")).toBe("peor");
  });
  it("mejor_si sube: lo que sube es mejora", () => {
    render(<CifraKpiCard cifra={F.CIFRA_SUBE} />);
    expect(screen.getByTestId("cifra-variacion").getAttribute("data-sentido")).toBe("mejor");
  });
  it("tarjeta nombrada para lectores de pantalla", () => {
    render(<CifraKpiCard cifra={F.CIFRA_SUBE} />);
    expect(screen.getByRole("group", { name: /Leads nuevos/ })).toBeInTheDocument();
  });
});
