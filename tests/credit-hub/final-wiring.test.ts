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
  test("extracts persisted bureau provenance from last_process_result", () => {
    const provenance = {
      data_source: "bureau",
      provider: "datacredito",
      environment: "LIVE",
      retrieved_at: "2026-08-25T12:00:00Z",
    };
    const app = expedienteToBankReviewApplication({
      application_id: "app-provenance",
      tenant_id: "tenant-1",
      decisions: [
        { kind: "last_process_result", payload: { bank_execution: provenance } },
      ],
      audit_trail: [{}, {}, { payload: { bank_execution: { environment: "MOCK" } } }],
    });

    expect(app.application_payload.credit_provenance).toEqual(provenance);
  });

  test("falls back to audit trail provenance when decisions are absent", () => {
    const raw = {
      audit_trail: [{}, {}, { payload: { bank_execution: {
        data_source: "bureau",
        provider: "manual",
        environment: "SANDBOX",
        retrieved_at: "2026-08-25T12:01:00Z",
      } } }],
    };
    const app = expedienteToBankReviewApplication({
      application_id: "app-audit-provenance",
      tenant_id: "tenant-1",
      ...raw,
    });

    expect(app.application_payload.credit_provenance?.environment).toBe("SANDBOX");
  });

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

  test("normalizes the /documents response shape for the bank card", () => {
    const app = expedienteToBankReviewApplication({
      application_id: "app-documents",
      tenant_id: "tenant-1",
      documents: [{
        doc_id: "02a391f4-0000-4000-a000-000000000001",
        filename: "matricula_vehiculo_qa.pdf",
        extraction_status: "COMPLETED",
        storage_key: "documents/key",
        is_active: true,
      }],
    });

    expect(app.application_payload.documents).toEqual([
      expect.objectContaining({
        id: "02a391f4-0000-4000-a000-000000000001",
        name: "matricula_vehiculo_qa.pdf",
        status: "COMPLETED",
      }),
    ]);
  });

  test("preserves documents already returned in the detail shape", () => {
    const document = { id: "doc-detail", name: "Matrícula", status: "validado", type: "vehicle" };
    const app = expedienteToBankReviewApplication({
      application_id: "app-detail-documents",
      tenant_id: "tenant-1",
      documents: [document],
    });

    expect(app.application_payload.documents).toEqual([document]);
  });

  test("preserves the backend bank claim for the decision view", () => {
    const claim = {
      analyst_id: "c1a0a001-0000-4000-a000-000000000001",
      claimed_at: "2026-09-02T17:34:30Z",
      lender_code: "pilot",
      current_user_owns: true,
    };
    const app = expedienteToBankReviewApplication({
      application_id: "app-claimed",
      tenant_id: "tenant-1",
      bank_claim: claim,
    });

    expect(app.bank_claim).toEqual(claim);
    expect(app.application_payload.bank_claim).toEqual(claim);
  });

  test("maps declaracion_vehiculo from credit_history summary", () => {
    const decl = {
      perdida_total: false,
      accidentes_reportados: "no" as const,
      gravamenes_vigentes: false,
      titulo_a_nombre_vendedor: true,
      kilometraje_coincide: true,
      firma_dealer: "Dealer Test",
      fecha_firma: "2026-07-09T10:30:00Z",
      hash: "hash1",
    };
    const app = expedienteToBankReviewApplication({
      application_id: "app-1",
      tenant_id: "tenant-1",
      credit_history: { summary: { declaracion_vehiculo: decl } },
    });
    expect(app.application_payload.declaracion_vehiculo).toEqual(decl);
  });

  test("uses financed amount when expediente summary has analysis but no financial block", () => {
    const app = expedienteToBankReviewApplication({
      application_id: "app-analysis-amount",
      tenant_id: "tenant-1",
      credit_history: { summary: { analysis: { financed_amount: 700000 } } },
    });
    expect(app.application_payload.financial?.requested_amount).toBe(700000);
  });
});
