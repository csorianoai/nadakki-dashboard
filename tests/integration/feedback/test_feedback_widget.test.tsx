/** @jest-environment jsdom */

import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { NPSPrompt } from "@/components/feedback/NPSPrompt";
import { NPSScoreSelector } from "@/components/feedback/NPSScoreSelector";
import { RatingStars } from "@/components/feedback/RatingStars";
import { useFeedback } from "@/hooks/useFeedback";
import * as fbApi from "@/lib/feedback/feedback-api";
import * as fetchClient from "@/lib/api/fetch-client";

jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/feedback/feedback-api", () => ({
  ...jest.requireActual("@/lib/feedback/feedback-api"),
  submitFeedback: jest.fn(),
}));

describe("feedback UI", () => {
  const originalFlag = process.env.NEXT_PUBLIC_FEATURE_FEEDBACK;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FEEDBACK = "true";
    localStorage.clear();
    jest.mocked(fetchClient.apiFetch).mockReset();
    jest.mocked(fbApi.submitFeedback).mockReset();
    jest.mocked(fbApi.submitFeedback).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FEEDBACK = originalFlag;
    localStorage.clear();
    jest.mocked(fbApi.submitFeedback).mockReset();
    jest.mocked(fetchClient.apiFetch).mockReset();
  });

  test("Floating widget hides when NEXT_PUBLIC_FEATURE_FEEDBACK=false", () => {
    process.env.NEXT_PUBLIC_FEATURE_FEEDBACK = "false";
    render(<FeedbackWidget />);
    expect(screen.queryByTestId("feedback-widget-launcher")).not.toBeInTheDocument();
  });

  test("Floating launcher opens accessible dialog", async () => {
    render(<FeedbackWidget context="widgets-test" />);
    await userEvent.click(screen.getByTestId("feedback-widget-launcher"));
    await screen.findByRole("dialog", { name: /¿cómo vamos/i });
    await screen.findByTestId("feedback-modal");

    await userEvent.click(screen.getByTestId("feedback-modal-close"));

    await waitFor(() => expect(screen.queryByTestId("feedback-modal")).not.toBeInTheDocument());
  });

  test("RatingStars updates via keyboard-friendly controls", async () => {
    const onChange = jest.fn();
    render(<RatingStars value={2} onChange={onChange} />);

    await userEvent.click(screen.getByTestId("rating-star-4"));

    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("radiogroup", { name: /Calificación de 1 a 5/i })).toBeInTheDocument();
  });

  test("FeedbackModal wires rating, comment, anonymity and thank-you state", async () => {
    const onSubmit = jest.fn(async () => undefined);

    const { rerender } = render(
      <FeedbackModal
        open
        onClose={() => undefined}
        isSubmitting={false}
        submitted={false}
        onSubmit={onSubmit}
        title="Prueba rápida"
      />,
    );

    await userEvent.click(screen.getByTestId("rating-star-3"));
    await userEvent.type(screen.getByTestId("feedback-comment"), "Genial equipo");
    await userEvent.click(screen.getByTestId("feedback-anonymous"));
    await userEvent.click(screen.getByTestId("feedback-submit"));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(3, "Genial equipo", expect.any(Boolean)),
    );

    rerender(
      <FeedbackModal
        open
        onClose={() => undefined}
        isSubmitting={false}
        submitted
        onSubmit={onSubmit}
      />,
    );

    await screen.findByTestId("feedback-thank-you");
  });

  test("shows throttled UX copy when submission error carries 429", () => {
    render(
      <FeedbackModal
        open
        onClose={() => undefined}
        isSubmitting={false}
        submitted={false}
        submitError="Feedback submit failed: 429"
        onSubmit={() => Promise.resolve()}
      />,
    );

    expect(screen.getByTestId("feedback-submit-error")).toHaveTextContent(/Demasiadas solicitudes/i);
  });

  test("NPSScoreSelector exposes colour bands for detractors, passives, promoters", () => {
    const onChange = jest.fn();
    const { rerender } = render(<NPSScoreSelector value={5} onChange={onChange} />);

    expect(screen.getByTestId("nps-score-6").className).toContain("border-red");

    rerender(<NPSScoreSelector value={7} onChange={onChange} />);

    expect(screen.getByTestId("nps-score-7").className).toContain("border-amber");

    rerender(<NPSScoreSelector value={9} onChange={onChange} />);

    expect(screen.getByTestId("nps-score-9").className).toContain("border-emerald");
  });

  test("cooldown prevents auto-opening NPS when timestamp is fresh", async () => {
    localStorage.setItem("nadakki_nps_last_shown", `${Date.now()}`);

    render(<NPSPrompt autoOffer />);

    await waitFor(() => expect(screen.queryByTestId("nps-modal")).not.toBeInTheDocument(), {
      timeout: 1000,
    });
  });

  test("Happy path NPS auto-offer submits contextual copy for passive bucket", async () => {
    localStorage.removeItem("nadakki_nps_last_shown");

    render(<NPSPrompt autoOffer />);

    await screen.findByTestId("nps-score-selector");

    await userEvent.click(screen.getByTestId("nps-score-9"));
    expect(screen.getByText(/¿Qué es lo que más te gustó/i)).toBeVisible();

    await userEvent.click(screen.getByTestId("nps-score-7"));
    await userEvent.type(screen.getByTestId("nps-detail"), "Más onboarding");

    await userEvent.click(screen.getByTestId("nps-submit"));

    await waitFor(() =>
      expect(fbApi.submitFeedback).toHaveBeenCalledWith({
        rating: 7,
        comment: "Más onboarding",
        context: "nps-survey",
        is_anonymous: false,
      }),
    );

    await screen.findByText(/¡Gracias por tu NPS!/i);
  });

  test("Defer CTA persists cooldown stamp without firing submit", async () => {
    localStorage.removeItem("nadakki_nps_last_shown");

    render(<NPSPrompt autoOffer />);

    await screen.findByTestId("nps-defer");
    await userEvent.click(screen.getByTestId("nps-defer"));

    await waitFor(() => expect(localStorage.getItem("nadakki_nps_last_shown")).toBeTruthy());
    expect(jest.mocked(fbApi.submitFeedback)).not.toHaveBeenCalled();
    expect(screen.queryByTestId("nps-modal")).not.toBeInTheDocument();
  });

  test("useFeedback exposes cooldown bookkeeping via localStorage", () => {
    const { result } = renderHook(() => useFeedback());
    localStorage.clear();
    expect(result.current.shouldShowNPS()).toBe(true);

    act(() => {
      result.current.markNPSShown();
    });

    expect(result.current.shouldShowNPS()).toBe(false);
  });

  test("getNPSSummary calls apiFetch with encoded period_days query", async () => {
    jest.mocked(fetchClient.apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        score: 28,
        promoters: 43,
        passives: 28,
        detractors: 29,
        total: 100,
        period_days: 30,
      }),
    } as unknown as Response);

    const summary = await fbApi.getNPSSummary(42);

    expect(fetchClient.apiFetch).toHaveBeenCalledWith(
      `/api/v2/feedback/nps/summary?period_days=${encodeURIComponent("42")}`,
      { method: "GET" },
    );
    expect(summary.total).toBe(100);
  });
});
