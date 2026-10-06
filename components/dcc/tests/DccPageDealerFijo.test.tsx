import { fireEvent, render, screen } from "@testing-library/react";
import { DccCard } from "@/components/dcc/DccCard";
import { DccKpi } from "@/components/dcc/DccKpi";
import { DccGrid, DccPage } from "@/components/dcc/DccPage";

/**
 * Fija el HTML que el dealer recibe de `DccPage` sin `marca`. La instantanea se
 * genero con el codigo de staging ANTERIOR a la generalizacion para el banco
 * (B1): si cambia, el dealer dejo de renderizar identico.
 */
const brandingDealer = jest.fn(() => ({
  data: { display_name: "Mapaal Automotores", locale: "es-AR", currency: "ARS", logo_url: "https://cdn.example/logo.svg" },
}));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => brandingDealer(),
}));

function paginaDealer() {
  return (
    <DccPage titulo="Command Center" acciones={<a href="/autos/dealer/reportes-v2">Reportes</a>}>
      <DccGrid>
        <DccCard titulo="Leads" calidad={{ estado: "verificado" }}>
          <DccKpi valor="37" calidad={{ estado: "verificado" }} />
        </DccCard>
        <DccCard titulo="Caja" calidad={{ estado: "no_disponible", motivo: "Falta endpoint" }} />
      </DccGrid>
    </DccPage>
  );
}

describe("DccPage del dealer (sin marca) renderiza identico", () => {
  beforeEach(() => brandingDealer.mockClear());

  it("tema claro: mismo HTML", () => {
    const { container } = render(paginaDealer());
    expect(container.innerHTML).toMatchSnapshot();
    expect(brandingDealer).toHaveBeenCalled();
  });

  it("tras conmutar a oscuro: mismo HTML", () => {
    const { container } = render(paginaDealer());
    fireEvent.click(screen.getByTestId("dcc-theme-toggle"));
    expect(container.innerHTML).toMatchSnapshot();
  });
});
