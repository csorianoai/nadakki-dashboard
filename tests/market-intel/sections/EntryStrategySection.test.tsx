import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryStrategySection } from "@/app/market-intel/components/sections/EntryStrategySection";
import { snapshotFullEntryStrategy } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("EntryStrategySection", () => {
  it("renderiza 3 cards de tier con instituciones clickeables", async () => {
    const onPick = jest.fn();
    render(
      <EntryStrategySection
        strategy={snapshotFullEntryStrategy}
        cur="RD$"
        onPick={onPick}
      />,
    );

    expect(screen.getByText("Tier 1")).toBeInTheDocument();
    expect(screen.getByText("Tier 2")).toBeInTheDocument();
    expect(screen.getByText("Tier 3")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("[object Object]");

    await userEvent.click(screen.getByRole("button", { name: /Banco Popular Dominicano/i }));
    expect(onPick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "institution",
        data: expect.objectContaining({ name: "Banco Popular Dominicano" }),
      }),
    );
  });
});
