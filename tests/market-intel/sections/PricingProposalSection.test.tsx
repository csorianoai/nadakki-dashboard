import { render, screen } from "@testing-library/react";
import { PricingProposalSection } from "@/app/market-intel/components/sections/PricingProposalSection";
import {
  snapshotFullPricingProposal,
} from "@/app/market-intel/lib/__fixtures__/snapshotFull";
import { snapshotMinimal } from "@/app/market-intel/lib/__fixtures__/snapshotMinimal";

describe("PricingProposalSection", () => {
  it("renderiza 3 planes con nombres y fees", () => {
    render(<PricingProposalSection pricing={snapshotFullPricingProposal} cur="RD$" />);

    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
    expect(screen.getByText("US$15")).toBeInTheDocument();
    expect(document.body.textContent).toContain("Setup US$500");
    expect(document.body.textContent).not.toContain("[object Object]");
  });

  it("muestra empty state cuando plans está vacío", () => {
    render(
      <PricingProposalSection pricing={snapshotMinimal.pricing_proposal} cur="RD$" />,
    );

    expect(screen.getByText("Propuesta de precios en preparación")).toBeInTheDocument();
  });
});
