import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdsHistoryTable } from "@/app/competitor-research/components/AdsHistoryTable";

describe("AdsHistoryTable", () => {
  it("shows empty state when no ads", () => {
    render(<AdsHistoryTable ads={[]} lang="en" />);
    expect(screen.getByText(/No ads found/i)).toBeInTheDocument();
  });

  it("renders rows and expands body on toggle", async () => {
    const user = userEvent.setup();
    render(
      <AdsHistoryTable
        ads={[
          {
            date: "2025-01-01",
            position: 1,
            title: "T1",
            body: "Long body text for expansion test",
            keywords: "k1",
            url: "https://x.com",
          },
        ]}
        lang="en"
      />
    );
    expect(screen.getByText("T1")).toBeInTheDocument();
    const expand = screen.getByRole("button", { name: /expand/i });
    await user.click(expand);
    expect(screen.getAllByText(/Long body text for expansion/).length).toBeGreaterThanOrEqual(1);
  });

  it("uses Spanish empty copy when lang es", () => {
    render(<AdsHistoryTable ads={[]} lang="es" />);
    expect(screen.getByText(/No se encontraron anuncios/i)).toBeInTheDocument();
  });
});
