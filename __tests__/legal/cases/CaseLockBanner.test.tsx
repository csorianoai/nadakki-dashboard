/** @jest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseLockBanner } from "@/components/legal/cases/CaseLockBanner";

describe("CaseLockBanner", () => {
  it("muestra bloqueo suave", () => {
    render(
      <CaseLockBanner
        lock={{
          lock_id: "l1",
          locked_by: "usuario-1",
          locked_at: "2026-01-01",
          lock_expires_at: "2026-01-01",
          lock_reason: "edición",
          lock_scope: "soft",
        }}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(/está editando este expediente/i);
  });
});
