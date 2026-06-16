import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { BankComplianceView } from "@/components/credit-hub/bank/BankComplianceView";

describe("BankComplianceView", () => {
  const wrap = (ui: ReactNode) => (
    <div className="credit-hub-forge" data-persona="bank">
      {ui}
    </div>
  );

  test("hero DO muestra Ley 172-13", () => {
    render(
      wrap(
        <BankComplianceView issues={[]} jurisdictionCode="DO" institutionName="Banco Test" />,
      ),
    );
    expect(
      screen.getByRole("heading", { name: "Perfil Ley 172-13 (República Dominicana)" }),
    ).toBeInTheDocument();
  });

  test("hero MX muestra CNBV", () => {
    render(
      wrap(
        <BankComplianceView issues={[]} jurisdictionCode="MX" institutionName="Banco Test" />,
      ),
    );
    expect(screen.getByRole("heading", { name: "Perfil CNBV (México)" })).toBeInTheDocument();
  });

  test("hero CO muestra SFC", () => {
    render(
      wrap(
        <BankComplianceView issues={[]} jurisdictionCode="CO" institutionName="Banco Test" />,
      ),
    );
    expect(screen.getByRole("heading", { name: "Perfil SFC (Colombia)" })).toBeInTheDocument();
  });

  test("jurisdicción desconocida usa fallback regulatorio", () => {
    render(
      wrap(
        <BankComplianceView issues={[]} jurisdictionCode="PE" institutionName="Financiera Lima" />,
      ),
    );
    expect(
      screen.getByRole("heading", { name: "Perfil Regulatorio — Financiera Lima" }),
    ).toBeInTheDocument();
  });
});
