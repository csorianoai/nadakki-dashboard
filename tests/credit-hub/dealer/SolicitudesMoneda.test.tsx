/**
 * Solicitudes: sin moneda del tenant no se publica un importe.
 *
 * `DealerApplicationsListView` tenia `currency = "MXN"` como valor por defecto.
 * Una pantalla sin moneda declarada --y la de Solicitudes pasa la del config,
 * que cae a DOP-- publicaba importes en pesos mexicanos. No es un detalle de
 * estilo: es una cifra con la moneda equivocada, que es peor que una ausente.
 */
import { render, screen } from "@testing-library/react";

import { DealerApplicationsListView } from "@/components/credit-hub/dealer/DealerApplicationsListView";
import { humanizeApplicant } from "@/lib/credit-hub/honesty/humanize-applicant";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

jest.mock("@/components/credit-hub/dealer/ApplicationMessageThread", () => ({
  useMessageUnreadCount: () => 0,
}));

function app(): CreditApplication {
  return {
    application_id: "app-0001",
    applicant_name: "Ana Pérez",
    requested_amount: "38500000",
    status: "submitted",
    created_at: new Date("2026-09-01").toISOString(),
    updated_at: new Date("2026-09-01").toISOString(),
    vehicle_make: "Toyota",
    vehicle_model: "Hilux",
    vehicle_year: 2021,
  } as unknown as CreditApplication;
}

describe("humanizeApplicant", () => {
  it("sin moneda del tenant el importe queda como em dash", () => {
    expect(humanizeApplicant(app(), null).amountLabel).toBe("—");
  });

  it("con la moneda del tenant el importe sale en esa moneda", () => {
    expect(humanizeApplicant(app(), "ARS").amountLabel).toContain("ARS");
    expect(humanizeApplicant(app(), "ARS").amountLabel).not.toContain("MX$");
  });
});

describe("DealerApplicationsListView", () => {
  it("sin prop de moneda no cae a MXN", () => {
    render(<DealerApplicationsListView applications={[app()]} />);
    expect(screen.queryByText(/MX\$/)).toBeNull();
    expect(screen.queryByText(/MXN/)).toBeNull();
    expect(screen.queryByText(/RD\$/)).toBeNull();
  });

  it("con moneda nula explicita tampoco", () => {
    render(<DealerApplicationsListView applications={[app()]} currency={null} />);
    expect(screen.queryByText(/MXN/)).toBeNull();
  });

  it("con la moneda del tenant publica el importe en esa moneda", () => {
    render(<DealerApplicationsListView applications={[app()]} currency="ARS" />);
    expect(screen.getByText(/ARS/)).toBeInTheDocument();
  });
});
