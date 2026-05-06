/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { AttorneyReviewBadge } from "@/components/legal/AttorneyReviewBadge";

describe("AttorneyReviewBadge", () => {
  it("renders compact and full text in Spanish", () => {
    const { rerender } = render(<AttorneyReviewBadge variant="compact" />);
    expect(screen.getByText("Requiere revisión")).toBeInTheDocument();
    rerender(<AttorneyReviewBadge variant="full" />);
    expect(screen.getByText(/Requiere revisión de abogado autorizado/i)).toBeInTheDocument();
  });
});
