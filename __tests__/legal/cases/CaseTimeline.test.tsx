/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseTimeline } from "@/components/legal/cases/CaseTimeline";

describe("CaseTimeline", () => {
  it("muestra vacío sin eventos", () => {
    render(<CaseTimeline events={[]} />);
    expect(screen.getByText(/No hay eventos registrados/i)).toBeInTheDocument();
  });

  it("lista eventos", () => {
    render(
      <CaseTimeline
        events={[
          {
            event_id: "e1",
            event_type: "cambio_estado",
            event_category: "lifecycle",
            occurred_at: "2026-01-01T10:00:00Z",
            payload: {},
          },
        ]}
      />
    );
    expect(screen.getByText("cambio_estado")).toBeInTheDocument();
  });
});
