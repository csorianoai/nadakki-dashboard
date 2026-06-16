import { render, screen } from "@testing-library/react";
import { DealerApplicationDetailView } from "@/components/credit-hub/dealer/DealerApplicationDetailView";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/lib/credit-hub/hooks/useCreditApplicationDetail", () => ({
  useCreditApplicationDetail: () => ({
    application: {
      application_id: "APP-1",
      applicant_name: "Ana López",
      status: "submitted",
      requested_amount: "500000",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw: {},
    },
    events: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "t1" }),
}));

jest.mock("@/lib/credit-hub/hooks/useTenantConfig", () => ({
  useTenantConfig: () => ({
    tenantConfig: { locale: "es-DO", currency_code: "DOP", institution_name: "Test" },
  }),
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    dealer: {
      field_name: "Nombre",
      field_email: "Email",
      field_phone: "Teléfono",
      field_amount: "Monto",
      vehicle_heading: "Vehículo",
      timeline_heading: "Historial",
      application_created: "Solicitud creada",
      detail_not_found: "No encontrada",
      detail_load_error: "Error",
      detail_not_found_hint: "Hint",
      detail_retry_hint: "Retry",
    },
    common: { go_back: "Volver", retry: "Reintentar" },
  }),
}));

describe("DealerApplicationDetailView", () => {
  test("renders applicant name", () => {
    render(
      <div className="credit-hub-forge" data-persona="dealer">
        <DealerApplicationDetailView applicationId="APP-1" />
      </div>,
    );
    expect(screen.getByRole("heading", { name: "Ana López" })).toBeInTheDocument();
  });
});
