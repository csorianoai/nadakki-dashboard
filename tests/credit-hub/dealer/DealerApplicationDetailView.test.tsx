import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealerApplicationDetailView } from "@/components/credit-hub/dealer/DealerApplicationDetailView";
import { useApplicationOffers } from "@/lib/credit-hub/hooks/useApplicationOffers";
import { acceptOffer } from "@/lib/credit-hub/api/creditCoreClient";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const mockDossierRefetch = jest.fn();
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
    refetch: mockDossierRefetch,
  }),
}));

jest.mock("@/lib/credit-hub/hooks/useApplicationOffers", () => ({
  useApplicationOffers: jest.fn(),
}));

jest.mock("@/lib/credit-hub/api/creditCoreClient", () => ({
  CreditCoreApiError: class CreditCoreApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "CreditCoreApiError";
      this.status = status;
    }
  },
  acceptOffer: jest.fn(),
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

const mockUseOffers = useApplicationOffers as jest.Mock;
const mockAcceptOffer = acceptOffer as jest.Mock;

type OfferOverrides = Partial<{
  id: string;
  lender_code: string;
  amount_approved: number | null;
  interest_rate_apr: number | null;
  term_months: number | null;
  monthly_payment: number | null;
  status: string;
}>;

function makeOffer(overrides: OfferOverrides = {}) {
  return {
    id: "off-1",
    application_id: "APP-1",
    tenant_id: "t1",
    lender_code: "banco_popular",
    amount_approved: 500000,
    interest_rate_apr: 12.5,
    term_months: 48,
    monthly_payment: 13200,
    status: "approved",
    created_at: new Date().toISOString(),
    raw: {},
    ...overrides,
  };
}

function setOffers(state: Partial<ReturnType<typeof useApplicationOffers>> = {}) {
  mockUseOffers.mockReturnValue({
    offers: [],
    pagination: null,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    ...state,
  });
}

function renderView() {
  return render(
    <div className="credit-hub-forge" data-persona="dealer">
      <DealerApplicationDetailView applicationId="APP-1" />
    </div>,
  );
}

describe("DealerApplicationDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOffers();
  });

  test("renders applicant name", () => {
    renderView();
    expect(screen.getByRole("heading", { name: "Ana López" })).toBeInTheDocument();
  });

  test("renders multiple competing bank offers when more than one is present", () => {
    setOffers({
      offers: [
        makeOffer({ id: "off-1", lender_code: "banco_popular" }),
        makeOffer({ id: "off-2", lender_code: "banco_bhd", interest_rate_apr: 11.2 }),
      ],
    });
    renderView();
    expect(screen.getByTestId("offers-section")).toBeInTheDocument();
    expect(screen.getByText("Banco Popular")).toBeInTheDocument();
    expect(screen.getByText("Banco Bhd")).toBeInTheDocument();
    // Each offer is independently selectable.
    expect(screen.getByTestId("offer-accept-off-1")).toBeInTheDocument();
    expect(screen.getByTestId("offer-accept-off-2")).toBeInTheDocument();
  });

  test("does not render an offers section when there are no offers yet", () => {
    setOffers({ offers: [] });
    renderView();
    expect(screen.queryByTestId("offers-section")).not.toBeInTheDocument();
    // The general status card still renders (does not break early-stage apps).
    expect(screen.getByText("Estado de tu solicitud")).toBeInTheDocument();
  });

  test("shows an independent loading state for the offers list", () => {
    setOffers({ isLoading: true });
    renderView();
    expect(screen.getByTestId("offers-loading")).toBeInTheDocument();
  });

  test("shows an error state when the offers list fails to load", () => {
    setOffers({ isError: true, error: new Error("network down") });
    renderView();
    expect(screen.getByTestId("offers-error")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();
  });

  test("accepts a specific offer with the correct offer_id and shows success", async () => {
    const refetchOffers = jest.fn();
    setOffers({
      offers: [makeOffer({ id: "off-2", lender_code: "banco_bhd" })],
      refetch: refetchOffers,
    });
    mockAcceptOffer.mockResolvedValue({
      ok: true,
      idempotent: false,
      offer: { offer_id: "off-2", status: "accepted" },
      application_state: "OFFER_SELECTED",
      previous_application_state: "PROCESSED",
      siblings_not_selected: 2,
    });

    renderView();
    await userEvent.click(screen.getByTestId("offer-accept-off-2"));
    // The select button opens an explicit confirmation modal; nothing is accepted yet.
    expect(mockAcceptOffer).not.toHaveBeenCalled();
    await screen.findByTestId("offer-confirm-modal");
    await userEvent.click(screen.getByTestId("confirm-modal-accept"));

    expect(mockAcceptOffer).toHaveBeenCalledWith({
      tenantId: "t1",
      applicationId: "APP-1",
      offerId: "off-2",
    });
    await waitFor(() => expect(screen.getByTestId("offers-accept-success")).toBeInTheDocument());
    expect(screen.getByTestId("offers-accept-success").textContent).toContain("Oferta aceptada");
    // Refetches both the offers list and the dossier for consistency.
    await waitFor(() => expect(refetchOffers).toHaveBeenCalled());
    expect(mockDossierRefetch).toHaveBeenCalled();
  });

  test("surfaces the real backend error when acceptance fails (offer already taken)", async () => {
    setOffers({ offers: [makeOffer({ id: "off-1" })] });
    mockAcceptOffer.mockRejectedValue(new Error("Offer already accepted by another dealer"));

    renderView();
    await userEvent.click(screen.getByTestId("offer-accept-off-1"));
    await screen.findByTestId("offer-confirm-modal");
    await userEvent.click(screen.getByTestId("confirm-modal-accept"));

    await waitFor(() => expect(screen.getByTestId("offers-accept-error")).toBeInTheDocument());
    expect(screen.getByText("Offer already accepted by another dealer")).toBeInTheDocument();
  });

  test("opens a confirmation modal before accepting and does not accept on cancel", async () => {
    setOffers({ offers: [makeOffer({ id: "off-1", lender_code: "banco_popular" })] });
    renderView();

    await userEvent.click(screen.getByTestId("offer-accept-off-1"));
    // Modal is shown with the chosen offer, and nothing has been accepted yet.
    expect(await screen.findByTestId("offer-confirm-modal")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-modal-lender").textContent).toContain("Banco Popular");
    expect(mockAcceptOffer).not.toHaveBeenCalled();

    // Cancelling closes the modal without accepting.
    await userEvent.click(screen.getByTestId("confirm-modal-cancel"));
    await waitFor(() =>
      expect(screen.queryByTestId("offer-confirm-modal")).not.toBeInTheDocument(),
    );
    expect(mockAcceptOffer).not.toHaveBeenCalled();
  });

  test("when an offer is already accepted, highlights it and marks others not selected without action buttons", () => {
    setOffers({
      offers: [
        makeOffer({ id: "off-1", lender_code: "banco_popular", status: "accepted" }),
        makeOffer({ id: "off-2", lender_code: "banco_bhd", status: "not_selected" }),
      ],
    });
    renderView();
    expect(screen.getByText("Elegida")).toBeInTheDocument();
    expect(screen.getByText("No seleccionada")).toBeInTheDocument();
    // No selectable buttons remain once an offer is accepted.
    expect(screen.queryByTestId("offer-accept-off-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("offer-accept-off-2")).not.toBeInTheDocument();
  });
});
