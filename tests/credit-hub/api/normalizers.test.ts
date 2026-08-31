import {
  normalizeApplication,
  normalizeApplications,
  normalizeEvent,
  normalizeStats,
  normalizeOffer,
} from "@/lib/credit-hub/api/normalizers";

describe("Credit Core normalizers", () => {
  test("normalizes application id and camelCase fields", () => {
    const app = normalizeApplication({
      id: "credit-1",
      applicantName: "Ana Pérez",
      requestedAmount: "750000",
      risk_score: 42,
      createdAt: "2026-04-27T12:00:00Z",
    });

    expect(app.application_id).toBe("credit-1");
    expect(app.applicant_name).toBe("Ana Pérez");
    expect(app.requested_amount).toBe("750000");
    expect(app.risk_score).toBe(42);
    expect(app.created_at).toBe("2026-04-27T12:00:00Z");
  });

  test("normalizes applications from envelope", () => {
    const apps = normalizeApplications({ applications: [{ application_id: "a1", applicant_name: "Luis" }] });
    expect(apps).toHaveLength(1);
    expect(apps[0].application_id).toBe("a1");
  });

  test("reads persisted applicant_data and vehicle_data payloads", () => {
    const app = normalizeApplication({
      id: "app-1",
      state: "DRAFT",
      application_payload: {
        applicant_data: { nombre_completo: "Ana Pérez", cedula: "00112345678", monto_solicitado: 888888 },
        vehicle_data: { make: "Toyota", model: "Corolla" },
      },
    });
    expect(app.applicant_name).toBe("Ana Pérez");
    expect(app.requested_amount).toBe("888888");
    expect(app.vehicle_make).toBe("Toyota");
  });

  test("normalizes stats from backend totals", () => {
    const stats = normalizeStats({
      totalApplications: 10,
      draftApplications: 2,
      submittedApplications: 3,
      applicationsThisWeek: 4,
      averageScore: 710,
    });

    expect(stats.total_applications).toBe(10);
    expect(stats.draft_applications).toBe(2);
    expect(stats.submitted_applications).toBe(3);
    expect(stats.applications_this_week).toBe(4);
    expect(stats.average_score).toBe(710);
  });

  test("preserves simulated offer provenance from bank_execution", () => {
    const offer = normalizeOffer({
      id: "offer-simulated",
      lender_code: "pilot",
      status: "APROBADO",
      bank_execution: {
        simulated: true,
        source_system: "PILOT_BANK_MOCK",
        adapter_operation_mode: "MOCK-SANDBOX",
      },
    });

    expect(offer.simulated).toBe(true);
    expect(offer.source_system).toBe("PILOT_BANK_MOCK");
    expect(offer.adapter_operation_mode).toBe("MOCK-SANDBOX");
  });

  test("normalizes event variations", () => {
    const event = normalizeEvent({
      eventId: "evt-1",
      eventType: "processed",
      message: "Processed by AI",
      timestamp: "2026-04-27T13:00:00Z",
    });

    expect(event.id).toBe("evt-1");
    expect(event.type).toBe("processed");
    expect(event.description).toBe("Processed by AI");
    expect(event.created_at).toBe("2026-04-27T13:00:00Z");
  });
});
