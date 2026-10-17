import { render } from "@testing-library/react";
import { BankDealerRanking } from "@/components/credit-hub/bank/BankDealerRanking";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const DEALER = "d3a1e500-1111-4222-8333-444455556666";

it("BankDealerRanking: un dealer que llega como UUID no se pinta; con nombre, sí", () => {
  const { container } = render(<BankDealerRanking dealers={[
    { dealer: DEALER, volume: 3, approved: 2, approval_rate: 0.66 },
    { dealer: "Autos del Caribe", volume: 2, approved: 1, approval_rate: 0.5 },
  ]} />);
  expect(container.textContent).not.toMatch(UUID);
  expect(container.textContent).toContain("Sin nombre");
  expect(container.textContent).toContain("Autos del Caribe");
});
