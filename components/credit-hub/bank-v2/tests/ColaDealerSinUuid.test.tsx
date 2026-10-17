import { render } from "@testing-library/react";
import { QueueTable } from "@/components/credit-hub/bank/shared/bankUi";
import { BankDecisionQueueSpotlight } from "@/components/credit-hub/bank/elite/BankDecisionQueueSpotlight";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const DEALER = "d3a1e500-1111-4222-8333-444455556666";

function item(dealer_name: string | null, id = "APP-0001"): BankQueueItem {
  return {
    application_id: id,
    state: "SUBMITTED",
    applicant_name: "Cliente Prueba",
    dealer_id: DEALER,
    dealer_name,
    vehicle_label: null,
    requested_amount: 1000,
    score: 700,
    risk_level: "LOW",
    priority: "MEDIA",
    created_at: null,
  } as unknown as BankQueueItem;
}

describe("dealer_name con forma de UUID en la cola del banco", () => {
  it("QueueTable no lo pinta; con nombre, sí", () => {
    const { container } = render(<QueueTable items={[item(DEALER), item("Autos del Caribe", "APP-0002")]} />);
    expect(container.textContent).not.toMatch(UUID);
    expect(container.textContent).toContain("Autos del Caribe");
  });

  it("BankDecisionQueueSpotlight no lo pinta; con nombre, sí", () => {
    const { container } = render(
      <BankDecisionQueueSpotlight items={[item(DEALER), item("Autos del Caribe", "APP-0002")]} pending={2} counterOffers={0} />,
    );
    expect(container.textContent).not.toMatch(UUID);
    expect(container.textContent).toContain("Autos del Caribe");
  });
});
