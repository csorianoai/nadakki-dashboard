import { presentMonthlyGoal } from "@/lib/credit-hub/utils/goalPresentation";
import { expedienteToBankReviewApplication } from "@/lib/credit-hub/utils/expedienteAdapter";

describe("goalPresentation", () => {
  test("formats ratio goal as percentage", () => {
    const card = presentMonthlyGoal(
      {
        metric_key: "approval_rate",
        target_value: 0.65,
        current_value: 0.42,
        unit: "ratio",
        label_es: "Tasa de aprobacion",
      },
      "DOP",
      "2026-07",
    );
    expect(card.currentDisplay).toBe("42%");
    expect(card.targetDisplay).toBe("≥65%");
    expect(card.title).toBe("Tasa de aprobacion");
  });

  test("hours goal cumplido when under target", () => {
    const card = presentMonthlyGoal(
      {
        metric_key: "avg_response_hours",
        target_value: 8,
        current_value: 6,
        unit: "hours",
        label_es: "Tiempo promedio respuesta",
      },
      "DOP",
      "2026-07",
    );
    expect(card.status).toBe("cumplido");
  });
});

describe("expedienteAdapter", () => {
  test("maps expediente/full into BankReviewApplication payload", () => {
    const app = expedienteToBankReviewApplication({
      application_id: "d3b05eed-0000-0000-0000-000000000001",
      tenant_id: "tenant-1",
      applicant: { name: "Pedro Antonio Martinez" },
      vehicle: { make: "Toyota", model: "RAV4" },
      credit_history: { score: 720, summary: { risk_level: "MEDIO", requested_amount: 1500000 } },
      documents: [{ id: "doc-1" }],
    });
    expect(app.application_id).toBe("d3b05eed-0000-0000-0000-000000000001");
    expect(app.application_payload.applicant).toEqual({ name: "Pedro Antonio Martinez" });
    expect(app.application_payload.analysis?.score).toBe(720);
    expect(app.application_payload.financial?.requested_amount).toBe(1500000);
    expect(app.application_payload.documents).toHaveLength(1);
  });
});
