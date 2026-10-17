jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: jest.fn(() => ({})) }));

import { registrationGate, statusToState } from "@/lib/realtor/property-intel/client";
import { HQ_DEMO } from "@/lib/realtor/property-intel/demo";

const base = { registration_required: true, registration_status: "not_confirmed" as const, prospect_submission_allowed: false, developer_links_allowed: false, is_default: true };

describe("property-intel", () => {
  it("mapea status a estado de tarjeta", () => {
    expect([401, 404, 503, 422, 500].map(statusToState)).toEqual(["session_expired", "hidden", "service_unavailable", "error", "error"]);
  });
  it("el gate de registro solo abre con confirmación y envío permitido", () => {
    expect(registrationGate(base)).toBe("blocked");
    expect(registrationGate({ ...base, registration_status: "confirmed" })).toBe("blocked");
    expect(registrationGate({ ...base, registration_status: "confirmed", prospect_submission_allowed: true })).toBe("open");
    expect(registrationGate({ ...base, registration_required: false })).toBe("not_required");
  });
  it("el HQ sintético trae un documento pending y ninguno falsamente almacenado", () => {
    expect(HQ_DEMO.documents.state === "ok" && HQ_DEMO.documents.data.filter((d) => d.status === "pending")).toHaveLength(1);
  });
});
