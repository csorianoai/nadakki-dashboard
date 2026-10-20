import { render, screen, within } from "@testing-library/react";
import { DealerDashboardView } from "@/components/credit-hub/dealer/DealerDashboardView";
import { normalizeApplication, normalizeEvent } from "@/lib/credit-hub/api/normalizers";
import { chRelTimeDealer } from "@/lib/credit-hub/dealer/dealerFormat";
import { amortizedMonthlyPayment } from "@/lib/credit-hub/dealer/offer-payment";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/credit-hub/hooks/useDashboardSummary", () => ({
  useDashboardSummary: () => ({ data: null, isFetching: false, isError: true, isLoading: false, error: null }),
}));
jest.mock("@/lib/credit-hub/hooks/useBanksRanking", () => ({
  useBanksRanking: () => ({ data: null, isError: true, isLoading: false }),
}));
jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: () => ({ offers: [], isLoading: false, isError: false }),
  offersRefetchInterval: () => false,
}));

// Ronda 3 de Cowork (20-oct), paso 9 y 1b del dealer.
const ahora = new Date().toISOString();
const borrador = (i: number) => normalizeApplication({ application_id: `DRAFT-${i}`, state: "DRAFT", display_status: "DRAFT", created_at: ahora });
// Forma real de una fila de GET /applications tras la contraoferta: sin payload, sin updated_at.
const lista = normalizeApplication({
  application_id: "3fe63b93-0000-0000-0000-000000000000",
  state: "BANK_COMPLETE",
  display_status: "APPROVED",
  applicant_name: "Lista V16",
  requested_amount: 480000,
  created_at: "2026-10-18T10:00:00Z",
});

function renderHome(apps = [...Array.from({ length: 7 }, (_, i) => borrador(i)), lista]) {
  return render(
    <div className="credit-hub-forge" data-persona="dealer">
      <DealerDashboardView applications={apps} institutionName="Auto Plaza" locale="es-DO" currency="DOP" />
    </div>,
  );
}

describe("Inicio del dealer (paso 9 y 1b)", () => {
  it("no muestra «+N en pipeline» ni «+N esta semana» sobre valores 0 (borradores y una solicitud ya decidida no son pipeline)", () => {
    renderHome();
    const strip = screen.getByTestId("dealer-kpi-strip");
    expect(strip.textContent).not.toMatch(/\+\d+ en pipeline/);
    expect(strip.textContent).not.toMatch(/\+\d+ esta semana/);
  });

  it("sin resumen, «Monto en pipeline» y «Mejor oferta abierta» dicen «No disponible»", () => {
    renderHome();
    const strip = screen.getByTestId("dealer-kpi-strip");
    const monto = within(strip).getByText("Monto en pipeline").closest(".ch-card") as HTMLElement;
    expect(monto).toHaveTextContent(/No disponible/);
    expect(monto).not.toHaveTextContent(/RD\$/);
    const rail = screen.getByTestId("dealer-pipeline-rail");
    const mejor = within(rail).getByText("Mejor oferta abierta").closest(".ch-card") as HTMLElement;
    expect(mejor).toHaveTextContent(/No disponible/);
  });

  it("la contraoferta pendiente (display_status APPROVED) cuenta en «Ofertas por decidir» y aparece en la lista", () => {
    renderHome();
    const rail = screen.getByTestId("dealer-pipeline-rail");
    const tile = within(rail).getAllByText("Ofertas por decidir")[0]!.closest(".ch-card") as HTMLElement;
    expect(tile).toHaveTextContent("1");
    expect(rail).toHaveTextContent(/Lista V16/);
  });
});

describe("Cronología del detalle", () => {
  it("lee emitted_at de los eventos del backend y no inventa «ahora» si falta la fecha", () => {
    expect(normalizeEvent({ id: "e1", emitted_at: "2026-10-20T09:00:00Z" }).created_at).toBe("2026-10-20T09:00:00Z");
    expect(chRelTimeDealer(normalizeEvent({ id: "e2" }).created_at)).toBe("—");
  });

  // En CI (UTC) pasa igual con o sin el arreglo; el rojo se ve con TZ=America/Santo_Domingo (navegador del dealer).
  it("una fecha de base sin zona horaria se interpreta en UTC", () => {
    expect(chRelTimeDealer("2026-10-20 09:00:00", new Date("2026-10-20T10:00:00Z"))).toBe("hace 1 h");
    expect(chRelTimeDealer("2026-10-20T09:00:00", new Date("2026-10-20T10:00:00Z"))).toBe("hace 1 h");
  });
});

describe("Cuota por amortización", () => {
  it("480 000 al 17 % a 48 meses da unos 13 850 (Cowork estimó 13 852)", () => {
    expect(Math.round(amortizedMonthlyPayment(480000, 17, 48)!)).toBeGreaterThanOrEqual(13848);
    expect(Math.round(amortizedMonthlyPayment(480000, 17, 48)!)).toBeLessThanOrEqual(13853);
    expect(amortizedMonthlyPayment(480000, 0.17, 48)).toBeCloseTo(amortizedMonthlyPayment(480000, 17, 48)!, 6);
  });
});
