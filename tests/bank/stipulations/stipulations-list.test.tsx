import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StipulationsList } from "@/components/bank/stipulations/StipulationsList";

const sample = [
  {
    id: "a",
    description: "First",
    status: "pending" as const,
  },
  {
    id: "b",
    description: "Second",
    status: "uploaded" as const,
  },
];

describe("StipulationsList", () => {
  test("renders cards and selection", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <StipulationsList
        applicationId="app-1"
        stipulations={sample}
        selectedId="a"
        role="BANK_ANALYST"
        canMutate={false}
        onSelect={onSelect}
        onPreview={jest.fn()}
        onVerify={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(screen.getByTestId("stipulations-list")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    await user.click(screen.getByTestId("stipulation-card-b"));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  test("admin sees verify control", () => {
    render(
      <StipulationsList
        applicationId="app-1"
        stipulations={sample}
        selectedId="a"
        role="TENANT_ADMIN"
        canMutate
        onSelect={jest.fn()}
        onPreview={jest.fn()}
        onVerify={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: /verificar/i }).length).toBeGreaterThan(0);
  });
});
