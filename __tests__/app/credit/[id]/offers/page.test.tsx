import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import OffersPage from "@/app/credit/[id]/offers/page";
import { MOCK_OFFERS_2_LENDERS } from "@/docs/frontend/mock-data";
import type { OffersResponse } from "@/types/credit-offers";
import * as UseSelectOfferModule from "@/hooks/useSelectOffer";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/hooks/useAuthContext", () => ({
  useAuthContext: () => ({
    tenantId: "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
  }),
}));

const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const fetchMock = jest.fn();

beforeEach(() => {
  pushMock.mockClear();
  toastSuccessMock.mockClear();
  toastErrorMock.mockClear();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => MOCK_OFFERS_2_LENDERS as OffersResponse,
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const APP_ID = MOCK_OFFERS_2_LENDERS.application_id;

describe("OffersPage", () => {
  it("test_page_renders_offers — fetches and renders OfferComparisonCards with offers list", async () => {
    render(<OffersPage params={{ id: APP_ID }} />);
    await waitFor(() => {
      expect(screen.getByTestId("offers-page")).toBeInTheDocument();
    });
    expect(screen.getByText(/2 ofertas/i)).toBeInTheDocument();
    expect(screen.getByTestId("offer-comparison-cards")).toBeInTheDocument();
  });

  it("test_modal_opens_on_select — clicking select on a card opens SelectionConfirmModal", async () => {
    const user = userEvent.setup();
    render(<OffersPage params={{ id: APP_ID }} />);
    await waitFor(() => screen.getByTestId("offers-page"));

    const firstOfferId = MOCK_OFFERS_2_LENDERS.offers[0].id;
    const selectBtn = screen.getByTestId(`select-offer-${firstOfferId}`);
    await user.click(selectBtn);

    await waitFor(() =>
      expect(screen.getByTestId("selection-confirm-modal")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("modal-lender-code")).toHaveTextContent("credicefi");
  });

  it("test_modal_cancel_closes — clicking Cancel closes modal without selecting", async () => {
    const user = userEvent.setup();
    render(<OffersPage params={{ id: APP_ID }} />);
    await waitFor(() => screen.getByTestId("offers-page"));

    const firstOfferId = MOCK_OFFERS_2_LENDERS.offers[0].id;
    await user.click(screen.getByTestId(`select-offer-${firstOfferId}`));
    await waitFor(() => screen.getByTestId("selection-confirm-modal"));

    await user.click(screen.getByTestId("modal-cancel-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("selection-confirm-modal")).not.toBeInTheDocument();
    });
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("test_modal_confirm_calls_useSelectOffer — clicking Confirm triggers mutation + 500ms latency mock", async () => {
    const user = userEvent.setup();
    render(<OffersPage params={{ id: APP_ID }} />);

    await waitFor(() => screen.getByTestId("offers-page"));

    const firstOfferId = MOCK_OFFERS_2_LENDERS.offers[0].id;
    await user.click(screen.getByTestId(`select-offer-${firstOfferId}`));
    await waitFor(() => screen.getByTestId("selection-confirm-modal"));

    await user.click(screen.getByTestId("modal-confirm-btn"));

    await waitFor(
      () => {
        expect(toastSuccessMock).toHaveBeenCalledWith(
          expect.stringContaining("credicefi"),
          expect.objectContaining({ description: expect.any(String) }),
        );
      },
      { timeout: 4000 },
    );
  });

  it("test_success_toast_redirects — after successful selection, redirects to funding route", async () => {
    const user = userEvent.setup();
    render(<OffersPage params={{ id: APP_ID }} />);
    await waitFor(() => screen.getByTestId("offers-page"));

    const firstOfferId = MOCK_OFFERS_2_LENDERS.offers[0].id;
    await user.click(screen.getByTestId(`select-offer-${firstOfferId}`));
    await waitFor(() => screen.getByTestId("selection-confirm-modal"));
    await user.click(screen.getByTestId("modal-confirm-btn"));

    await waitFor(
      () => {
        expect(pushMock).toHaveBeenCalledWith(`/credit/${APP_ID}/funding`);
      },
      { timeout: 4000 },
    );
  });

  it("test_error_toast_shows_retry — if selectOffer rejects, toast.error with Retry action surfaces", async () => {
    jest.spyOn(UseSelectOfferModule, "useSelectOffer").mockImplementation(
      ({ onError }) => ({
        selectOffer: jest.fn(async () => {
          const err = new Error("Mock failure for retry test");
          onError?.(err);
          throw err;
        }),
        selectedOfferId: null,
        isSubmitting: false,
        error: null,
      }),
    );

    const user = userEvent.setup();
    render(<OffersPage params={{ id: APP_ID }} />);
    await waitFor(() => screen.getByTestId("offers-page"));

    const firstOfferId = MOCK_OFFERS_2_LENDERS.offers[0].id;
    await user.click(screen.getByTestId(`select-offer-${firstOfferId}`));
    await waitFor(() => screen.getByTestId("selection-confirm-modal"));
    await user.click(screen.getByTestId("modal-confirm-btn"));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Error al seleccionar oferta",
        expect.objectContaining({
          description: expect.any(String),
          action: expect.objectContaining({
            label: "Reintentar",
            onClick: expect.any(Function),
          }),
        }),
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
