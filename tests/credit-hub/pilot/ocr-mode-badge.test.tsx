import { render, screen } from "@testing-library/react";
import { OcrModeBadge } from "@/components/credit-hub/labels/OcrModeBadge";

describe("OcrModeBadge", () => {
  it("manual mode", () => {
    render(<OcrModeBadge value="manual" />);
    expect(screen.getByTestId("ocr-mode-badge")).toHaveTextContent("REVISIÓN MANUAL");
  });

  it("null shows Not Set", () => {
    render(<OcrModeBadge value={undefined} />);
    expect(screen.getByTestId("ocr-mode-badge")).toHaveTextContent("Not Set");
  });
});
