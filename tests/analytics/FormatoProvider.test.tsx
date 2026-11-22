import { render, screen } from "@testing-library/react";
import { CifraKpiCard, FormatoProvider, useFormato } from "@/components/analytics/kit";
import { CeldaCifra } from "@/components/analytics/kit/tabla";
import { Embudo } from "@/components/analytics/kit";
import { formatoDesdeTenant } from "@/lib/analytics/formato";
import * as F from "./fixtures/cifras.fixture";

const norm = (s: string | null) => (s ?? "").replace(/[\s  ]+/g, " ").trim();

const COSTO = { ...F.CIFRA_COSTO_SUBE, moneda: undefined };

function Sonda() {
  const f = useFormato();
  return <span data-testid="sonda">{`${f.locale}|${f.moneda}`}</span>;
}

describe("FormatoProvider", () => {
  it("sin proveedor: es-US / USD", () => {
    render(<Sonda />);
    expect(screen.getByTestId("sonda")).toHaveTextContent("es-US|USD");
  });
  it("Baylara: $12.00 y fecha en ingles", () => {
    render(
      <FormatoProvider formato={formatoDesdeTenant({ locale: "en-US", currency: "USD" })}>
        <CifraKpiCard cifra={COSTO} />
      </FormatoProvider>
    );
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText(/Dato al Nov 10, 2026/)).toBeInTheDocument();
  });
  it("MAPAAL: $ 12,00 (ARS) con separadores argentinos y variacion con coma", () => {
    render(
      <FormatoProvider formato={formatoDesdeTenant({ locale: "es-AR", currency: "ARS" })}>
        <CifraKpiCard cifra={COSTO} />
      </FormatoProvider>
    );
    expect(norm(document.body.textContent)).toContain("$ 12,00");
    expect(norm(screen.getByTestId("cifra-variacion").textContent)).toMatch(/\+20,0\s?%/);
  });
  it("la celda de tabla y el embudo siguen al proveedor", () => {
    render(
      <FormatoProvider formato={{ locale: "es-AR", moneda: "ARS" }}>
        <CeldaCifra cifra={{ ...F.CIFRA_SUBE, valor: 4820 }} />
        <Embudo
          meta={{ titulo: "Embudo", fuente: "PROTOTIPO · fixture", fecha_dato: "2026-11-10", estado: "ok" }}
          etapas={[{ etiqueta: "Contactos", valor: 1000 }, { etiqueta: "Visitas", valor: 400 }]}
        />
      </FormatoProvider>
    );
    expect(screen.getAllByText("4.820").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/40,0\s?%/).length).toBeGreaterThan(0);
  });
  it("un formato invalido en el proveedor cae al defecto y no rompe el render", () => {
    render(
      <FormatoProvider formato={{ locale: "@@", moneda: "nope" }}>
        <Sonda />
      </FormatoProvider>
    );
    expect(screen.getByTestId("sonda")).toHaveTextContent("es-US|USD");
  });
});
