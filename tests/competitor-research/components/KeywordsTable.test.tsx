import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeywordsTable } from "@/app/competitor-research/components/KeywordsTable";

describe("KeywordsTable", () => {
  it("switches paid / organic tabs", async () => {
    const user = userEvent.setup();
    render(
      <KeywordsTable
        paid={[{ keyword: "paidkw", search_volume: 1 }]}
        organic={[{ keyword: "orgkw", search_volume: 2 }]}
        lang="en"
      />
    );
    expect(screen.getByText("paidkw")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Organic/i }));
    expect(screen.getByText("orgkw")).toBeInTheDocument();
  });
});
