import { render, screen } from "@testing-library/react";
import { PricingProposalSection } from "@/app/market-intel/components/PricingProposalSection";
import {
  snapshotFullPricingProposal,
} from "@/app/market-intel/lib/__fixtures__/snapshotFull";
import { snapshotMinimal as minimalSnapshot } from "@/app/market-intel/lib/__fixtures__/snapshotMinimal";

describe("PricingProposalSection", () => {
  it("renderiza planes y fees formateados con snapshot completo", () => {
    render(<PricingProposalSection pricingProposal={snapshotFullPricingProposal} />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("US$ 500")).toBeInTheDocument();
    expect(screen.getByText("US$ 15")).toBeInTheDocument();
    expect(screen.getByText("US$ 1,500")).toBeInTheDocument();
    expect(screen.getByText("US$ 10")).toBeInTheDocument();
    expect(screen.getByText("US$ 5,000")).toBeInTheDocument();
    expect(screen.getByText("US$ 7")).toBeInTheDocument();
    expect(screen.getByText("Bronze")).toBeInTheDocument();
    expect(screen.getByText("Silver")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/i)).not.toBeInTheDocument();
  });

  it("muestra empty state cuando plans está vacío", () => {
    render(<PricingProposalSection pricingProposal={minimalSnapshot.pricing_proposal} />);

    expect(screen.getByText("Sin planes configurados aún")).toBeInTheDocument();
    expect(screen.getByText("Sin tiers de dealer configurados aún")).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/i)).not.toBeInTheDocument();
    expect(screen.queryByText("PLANS:")).not.toBeInTheDocument();
  });

  it("no stringifica arrays como [object Object]", () => {
    render(
      <PricingProposalSection
        pricingProposal={{
          currency: "USD",
          plans: [{ name: "A", setup_fee: 1 }],
          dealer_tiers: [{ tier: "T1", monthly_fee: 99 }],
        }}
      />
    );
    expect(document.body.textContent).not.toContain("[object Object]");
  });
});
