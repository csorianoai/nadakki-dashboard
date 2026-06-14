import { render, screen } from "@testing-library/react";
import { IntelligenceView } from "@/app/market-intel/components/IntelligenceView";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("IntelligenceView smoke", () => {
  it("no renderiza [object Object] con snapshot completo", () => {
    render(<IntelligenceView snapshot={snapshotFull} currency="USD" />);

    expect(screen.getByText("Panorama de mercado")).toBeInTheDocument();
    expect(screen.getByText("Propuesta de precios")).toBeInTheDocument();
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("[object Object]");
  });
});
