import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock dependencies before importing component
jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => ({
    common: {
      retry: "Reintentar",
    },
    liveness: {
      title: "Verificacion biometrica",
      consent_title: "Autorizacion de verificacion biometrica",
      consent_body: "Texto legal Ley 172-13...",
      consent_accept: "Autorizo la verificacion biometrica",
      skip_dev: "Omitir (solo desarrollo)",
      capture_instruction: "Posiciona tu rostro frente a la camara.",
      capture_button: "Iniciar captura",
      camera_blocked: "No pudimos acceder a la camara.",
      processing: "Verificando identidad...",
      generic_error: "Ocurrio un error durante la verificacion.",
      confidence: "Confianza",
      result_live: "Verificacion biometrica completa",
      result_needs_review: "Tu identidad sera verificada por nuestro equipo",
      result_needs_review_detail: "La verificacion automatica no fue concluyente.",
      result_spoof: "No se pudo verificar tu identidad",
      result_spoof_detail: "La captura no paso la verificacion de autenticidad.",
      result_not_applicable: "Verificacion biometrica no disponible.",
    },
  }),
}));

const mockRunLivenessCheck = jest.fn();
jest.mock("@/lib/credit-hub/identity/liveness-client", () => ({
  runLivenessCheck: (...args: unknown[]) => mockRunLivenessCheck(...args),
}));

const mockCapture = jest.fn();
const mockIsAvailable = jest.fn().mockReturnValue(true);
const mockCleanup = jest.fn();
jest.mock("@/lib/credit-hub/identity/capture-adapter", () => ({
  selectAdapter: () => ({
    name: "mock",
    isAvailable: mockIsAvailable,
    capture: mockCapture,
    cleanup: mockCleanup,
  }),
}));

import {
  LivenessCapture,
  livenessAllowsSubmit,
  livenessSubmitWarning,
} from "@/components/credit-hub/customer/identity/LivenessCapture";

describe("LivenessCapture", () => {
  const defaultProps = {
    applicationId: "app-123",
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCapture.mockResolvedValue({ b64: "fakeBase64", mime: "image/jpeg" });
    mockIsAvailable.mockReturnValue(true);
  });

  it("renders consent screen first", () => {
    render(<LivenessCapture {...defaultProps} />);
    expect(screen.getByTestId("liveness-consent")).toBeInTheDocument();
    expect(screen.getByText("Autorizacion de verificacion biometrica")).toBeInTheDocument();
    expect(screen.getByTestId("liveness-consent-accept")).toBeInTheDocument();
  });

  it("does not advance to capture without consent", () => {
    render(<LivenessCapture {...defaultProps} />);
    // Consent screen is shown, capture step is not
    expect(screen.getByTestId("liveness-consent")).toBeInTheDocument();
    expect(screen.queryByTestId("liveness-capture-step")).not.toBeInTheDocument();
  });

  it("advances to capture after consent", () => {
    render(<LivenessCapture {...defaultProps} />);
    fireEvent.click(screen.getByTestId("liveness-consent-accept"));
    expect(screen.queryByTestId("liveness-consent")).not.toBeInTheDocument();
    expect(screen.getByTestId("liveness-capture-step")).toBeInTheDocument();
  });

  it("shows error and retry when capture fails", async () => {
    mockCapture.mockRejectedValueOnce(new Error("Camera failed"));
    render(<LivenessCapture {...defaultProps} />);

    // Accept consent
    fireEvent.click(screen.getByTestId("liveness-consent-accept"));

    // Start capture
    await act(async () => {
      fireEvent.click(screen.getByTestId("liveness-start-capture"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("liveness-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("liveness-retry")).toBeInTheDocument();
  });

  it("shows live result with success state", async () => {
    const liveResult = {
      status: "live" as const,
      pad_score: 0.95,
      provider: "MOCK",
      evidence_id: "ev-123",
      requires_manual_review: false,
      blocked: false,
    };
    mockRunLivenessCheck.mockResolvedValueOnce(liveResult);
    const onComplete = jest.fn();

    render(<LivenessCapture {...defaultProps} onComplete={onComplete} />);

    // Accept consent
    fireEvent.click(screen.getByTestId("liveness-consent-accept"));

    // Start capture
    await act(async () => {
      fireEvent.click(screen.getByTestId("liveness-start-capture"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("liveness-result")).toBeInTheDocument();
    });

    expect(screen.getByTestId("liveness-result")).toHaveAttribute("data-status", "live");
    expect(screen.getByText("Verificacion biometrica completa")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith(liveResult);
  });

  it("shows spoof result with error state and disables submit", async () => {
    const spoofResult = {
      status: "spoof" as const,
      pad_score: 0.15,
      provider: "MOCK",
      evidence_id: null,
      requires_manual_review: false,
      blocked: true,
    };
    mockRunLivenessCheck.mockResolvedValueOnce(spoofResult);

    render(<LivenessCapture {...defaultProps} />);

    fireEvent.click(screen.getByTestId("liveness-consent-accept"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("liveness-start-capture"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("liveness-result")).toBeInTheDocument();
    });

    expect(screen.getByTestId("liveness-result")).toHaveAttribute("data-status", "spoof");
    expect(screen.getByText("No se pudo verificar tu identidad")).toBeInTheDocument();
  });

  it("needs_review advances with warning", async () => {
    const reviewResult = {
      status: "needs_review" as const,
      pad_score: 0.55,
      provider: "MOCK",
      evidence_id: "ev-456",
      requires_manual_review: true,
      blocked: false,
    };
    mockRunLivenessCheck.mockResolvedValueOnce(reviewResult);
    const onComplete = jest.fn();

    render(<LivenessCapture {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("liveness-consent-accept"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("liveness-start-capture"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("liveness-result")).toBeInTheDocument();
    });

    expect(screen.getByTestId("liveness-result")).toHaveAttribute("data-status", "needs_review");
    expect(onComplete).toHaveBeenCalledWith(reviewResult);
  });

  it("shows camera blocked error when adapter unavailable", async () => {
    mockIsAvailable.mockReturnValue(false);

    render(<LivenessCapture {...defaultProps} />);
    fireEvent.click(screen.getByTestId("liveness-consent-accept"));

    await act(async () => {
      fireEvent.click(screen.getByTestId("liveness-start-capture"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("liveness-error")).toBeInTheDocument();
    });
    expect(screen.getByText("No pudimos acceder a la camara.")).toBeInTheDocument();
  });
});

describe("livenessAllowsSubmit", () => {
  it("returns false when result is null", () => {
    expect(livenessAllowsSubmit(null)).toBe(false);
  });

  it("returns true for live status", () => {
    expect(
      livenessAllowsSubmit({
        status: "live",
        pad_score: 0.95,
        provider: "MOCK",
        evidence_id: "ev-1",
        requires_manual_review: false,
        blocked: false,
      }),
    ).toBe(true);
  });

  it("returns true for needs_review status", () => {
    expect(
      livenessAllowsSubmit({
        status: "needs_review",
        pad_score: 0.55,
        provider: "MOCK",
        evidence_id: "ev-2",
        requires_manual_review: true,
        blocked: false,
      }),
    ).toBe(true);
  });

  it("returns false for spoof status", () => {
    expect(
      livenessAllowsSubmit({
        status: "spoof",
        pad_score: 0.10,
        provider: "MOCK",
        evidence_id: null,
        requires_manual_review: false,
        blocked: true,
      }),
    ).toBe(false);
  });

  it("returns false for not_applicable status", () => {
    expect(
      livenessAllowsSubmit({
        status: "not_applicable",
        pad_score: null,
        provider: null,
        evidence_id: null,
        requires_manual_review: false,
        blocked: false,
      }),
    ).toBe(false);
  });
});

describe("livenessSubmitWarning", () => {
  it("returns null for null result", () => {
    expect(livenessSubmitWarning(null)).toBeNull();
  });

  it("returns null for live result", () => {
    expect(
      livenessSubmitWarning({
        status: "live",
        pad_score: 0.95,
        provider: "MOCK",
        evidence_id: "ev-1",
        requires_manual_review: false,
        blocked: false,
      }),
    ).toBeNull();
  });

  it("returns 'needs_review' for needs_review result", () => {
    expect(
      livenessSubmitWarning({
        status: "needs_review",
        pad_score: 0.55,
        provider: "MOCK",
        evidence_id: "ev-2",
        requires_manual_review: true,
        blocked: false,
      }),
    ).toBe("needs_review");
  });

  it("returns 'blocked' for spoof result", () => {
    expect(
      livenessSubmitWarning({
        status: "spoof",
        pad_score: 0.10,
        provider: "MOCK",
        evidence_id: null,
        requires_manual_review: false,
        blocked: true,
      }),
    ).toBe("blocked");
  });
});
