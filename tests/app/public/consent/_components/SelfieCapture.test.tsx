/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelfieCapture } from "@/app/(public)/consent/[token]/_components/SelfieCapture";

describe("SelfieCapture", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }],
        }),
      },
    });
  });

  it("shows take selfie button initially", () => {
    render(<SelfieCapture onCapture={() => {}} captured={null} />);
    expect(screen.getByTestId("selfie-start")).toBeInTheDocument();
  });

  it("starts camera when clicking take selfie", async () => {
    const user = userEvent.setup();
    render(<SelfieCapture onCapture={() => {}} captured={null} />);
    await user.click(screen.getByTestId("selfie-start"));
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it("shows captured image and retake button when captured", () => {
    render(<SelfieCapture onCapture={() => {}} captured="data:image/jpeg;base64,xxx" />);
    expect(screen.getByTestId("selfie-retake")).toBeInTheDocument();
  });

  it("shows camera blocked error when getUserMedia fails", async () => {
    const user = userEvent.setup();
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValueOnce(new Error("denied"));
    render(<SelfieCapture onCapture={() => {}} captured={null} />);
    await user.click(screen.getByTestId("selfie-start"));
    expect(await screen.findByText(/cámara|permisos/i)).toBeInTheDocument();
  });
});
