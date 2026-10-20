import { render, screen } from "@testing-library/react";
import { normalizeApplication } from "@/lib/credit-hub/api/normalizers";
import { resolveDisplayStatus, resolveDisplayStatusLabel } from "@/lib/credit-hub/honesty/display-status";
import { DealerStatusBadge } from "@/components/credit-hub/dealer/shared/dealerUi";
import { RecentApplicationsTable } from "@/components/credit-hub/dealer/elite/RecentApplicationsTable";
import { ActiveApplicationsTable } from "@/components/credit-hub/dealer/sections/ActiveApplicationsTable";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

// DB-CODEX-16 (c), Cowork 20-oct: el banco hizo CONTRAOFERTA sobre LISTA y el dealer la veía approved/Completada.
// Detalle real: state BANK_COMPLETE (no cambia tras decidir) + application_payload.bank_decision.decision CONTRA_OFERTA.
const detalle = {
  application_id: "LISTA-1",
  state: "BANK_COMPLETE",
  application_payload: { bank_decision: { decision: "CONTRA_OFERTA", lender_code: "BANCO_A" } },
};
// Lista real: sin payload; display_status del servidor APPROVED (cuenta contraofertas y aprobaciones juntas).
const fila = { application_id: "LISTA-1", state: "BANK_COMPLETE", display_status: "APPROVED", applicant_name: "Ana", requested_amount: 1000 };

describe("Contraoferta vista por el dealer", () => {
  it("el detalle con bank_decision CONTRA_OFERTA queda en counter_offer y el badge dice Contraoferta", () => {
    const app = normalizeApplication(detalle);
    expect(app.status).toBe("counter_offer");
    render(<DealerStatusBadge status={app.status} />);
    expect(screen.getByText("Contraoferta")).toBeInTheDocument();
  });

  it("un estado conditioned no cae en el badge de Borrador", () => {
    render(<DealerStatusBadge status="conditioned" />);
    expect(screen.queryByText("Borrador")).toBeNull();
  });

  it("una contraoferta nunca se agrupa como Completada aunque el estado del backend sea BANK_COMPLETE", () => {
    expect(resolveDisplayStatus("counter_offer", "BANK_COMPLETE")).toBe("OFFERED");
    expect(resolveDisplayStatus("conditioned", "BANK_COMPLETE")).not.toBe("FUNDED");
  });

  it("display_status APPROVED del servidor no se pinta como «approved» crudo", () => {
    const r = resolveDisplayStatusLabel({ displayStatus: "APPROVED", status: "processed" });
    expect(r.label).not.toMatch(/^approved$/i);
    expect(r.label).toBe("Con ofertas");
  });

  it("las tablas del inicio del dealer usan el display_status del servidor y no muestran Completada", () => {
    const app = normalizeApplication(fila);
    const { unmount } = render(<RecentApplicationsTable apps={[app]} currency="DOP" />);
    expect(screen.queryByText("Completada")).toBeNull();
    expect(screen.getByText("Con ofertas")).toBeInTheDocument();
    unmount();
    render(<ActiveApplicationsTable apps={[app]} currency="DOP" />);
    expect(screen.queryByText("Completada")).toBeNull();
    expect(screen.getByText("Con ofertas")).toBeInTheDocument();
  });
});
